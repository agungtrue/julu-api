export const dashboardSummaryQuery = `
        WITH order_cogs AS (
          -- Step 1: Agregasi per Order (COGS + Jumlah Snack/Item)
          SELECT 
            oi.order_id,
            SUM(oi.qty * COALESCE(oi.cogs_at_purchase, p.cogs, 0)) AS total_cogs,
            SUM(CASE WHEN LOWER(p.type::text) IN ('coffee', 'kopi') THEN oi.qty ELSE 0 END) AS coffee_qty,
            SUM(CASE WHEN LOWER(p.type::text) IN ('non_coffee', 'non-coffee', 'noncoffee') THEN oi.qty ELSE 0 END) AS non_coffee_qty,
            SUM(CASE WHEN p.type = 'snacks' THEN oi.qty ELSE 0 END) AS snack_qty,
            SUM(oi.qty) AS item_qty
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          LEFT JOIN products p ON p.id = oi.product_id
          WHERE oi."tenantId" = $1
            AND o.status = 'confirmed'
            AND o.created_at >= $2
            AND o.created_at <= $3
          GROUP BY oi.order_id
        ),
        order_summary AS (
          -- Step 2: Agregasi Metrik Utama Orders & Payment Methods
          SELECT 
            COUNT(o.id) FILTER (WHERE o.status = 'confirmed')::int AS "totalConfirmedOrders",
            COUNT(o.id) FILTER (WHERE o.status = 'init')::int AS "totalPendingOrders",
            COUNT(o.id) FILTER (WHERE o.status = 'cancelled')::int AS "totalCancelledOrders",

            -- Revenue & COGS
            COALESCE(SUM(o.total) FILTER (WHERE o.status = 'confirmed'), 0)::numeric AS "totalRevenue",
            COALESCE(SUM(c.total_cogs) FILTER (WHERE o.status = 'confirmed'), 0)::numeric AS "totalCogs",
            COALESCE(SUM(c.snack_qty) FILTER (WHERE o.status = 'confirmed'), 0)::int AS "totalSnacks",
            COALESCE(SUM(c.item_qty) FILTER (WHERE o.status = 'confirmed'), 0)::int AS "totalItemsSold",
            COALESCE(SUM(c.coffee_qty) FILTER (WHERE o.status = 'confirmed'), 0)::int AS "coffeeCups",
            COALESCE(SUM(c.non_coffee_qty) FILTER (WHERE o.status = 'confirmed'), 0)::int AS "nonCoffeeCups",

            -- Payment Methods Breakdown (confirmed Only)
            COUNT(o.id) FILTER (WHERE o.status = 'confirmed' AND LOWER(o.payment_method) = 'qris')::int AS "qrisCount",
            COUNT(o.id) FILTER (WHERE o.status = 'confirmed' AND LOWER(o.payment_method) = 'cash')::int AS "cashCount",
            COALESCE(SUM(o.total) FILTER (WHERE o.status = 'confirmed' AND LOWER(o.payment_method) = 'qris'), 0)::numeric AS "qrisAmount",
            COALESCE(SUM(o.total) FILTER (WHERE o.status = 'confirmed' AND LOWER(o.payment_method) = 'cash'), 0)::numeric AS "cashAmount"
          FROM orders o
          LEFT JOIN order_cogs c ON c.order_id = o.id
          WHERE o."tenantId" = $1
            AND o.created_at >= $2
            AND o.created_at <= $3
        ),
        opex_summary AS (
          -- Step 3: Total Beban Operasional Kumulatif
          SELECT 
            COALESCE(SUM(op.amount), 0)::numeric AS "totalOpex"
          FROM opex op
          WHERE op."tenantId" = $1
        ),
        loss_summary AS (
          -- Step 4: Loss Mutation / Stock Loss
          SELECT 
            COALESCE(SUM(im.quantity * im.cost_per_unit), 0)::numeric "totalLossNominal",
            COUNT(im.id)::int AS "totalLossCount"
          FROM ingredient_mutations im
          WHERE im."tenantId" = $1
            AND im.type = 'LOSS'
            AND im.created_at >= $2
            AND im.created_at <= $3
        ),
        best_sellers_raw AS (
          -- Step 5: Cari 10 Produk Terlaris (Fixed: WHERE)
          SELECT 
            p.name,
            SUM(oi.qty)::int AS count
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          JOIN products p ON p.id = oi.product_id
          WHERE o."tenantId" = $1
            AND o.status = 'confirmed'
            AND o.created_at >= $2
            AND o.created_at <= $3
          GROUP BY p.name
          ORDER BY count DESC
          LIMIT 10
        ),
        best_sellers_json AS (
          -- Step 6: Convert Best Sellers ke JSON Array
          SELECT 
            COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'name', bs.name,
                  'count', bs.count,
                  'percentage', CASE 
                    WHEN os."totalItemsSold" > 0 
                    THEN ROUND((bs.count::numeric / os."totalItemsSold"::numeric) * 100, 2) 
                    ELSE 0 
                  END
                )
              ), 
              '[]'::jsonb
            ) AS "bestSellers"
          FROM best_sellers_raw bs
          CROSS JOIN order_summary os
        ),
          user_performances_raw AS (
          -- Step 6: Performa Kasir / User
          SELECT 
            u.name,
            COUNT(DISTINCT o.id)::int AS transactions,
            COALESCE(SUM(CASE WHEN LOWER(p.type::text) IN ('coffee', 'non_coffee') THEN oi.qty ELSE 0 END), 0)::int AS cups,
            COALESCE(SUM(CASE WHEN LOWER(p.type::text) IN ('snack', 'snacks') THEN oi.qty ELSE 0 END), 0)::int AS snacks
          FROM orders o
          JOIN users u ON u.id = o."userId"
          JOIN order_items oi ON oi.order_id = o.id
          JOIN products p ON p.id = oi.product_id
          WHERE o."tenantId" = $1
            AND o.status = 'confirmed'
            AND o.created_at >= $2
            AND o.created_at <= $3
          GROUP BY u.id, u.name
        ),
        user_performances_json AS (
          SELECT 
            COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'name', up.name,
                  'transactions', up.transactions,
                  'items', jsonb_build_object(
                    'cups', up.cups,
                    'snacks', up.snacks
                  )
                )
              ),
              '[]'::jsonb
            ) AS "userPerformances"
          FROM user_performances_raw up
        ),
        stock_alerts_json AS (
          -- Step 7: Menggantikan ingredientRepo QueryBuilder (Stock <= MinimumStock)
          SELECT 
            COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'id', ing.id,
                  'name', ing.name,
                  'stock', ing.stock,
                  'minimumStock', ing."minimumStock",
                  'unit', ing.unit
                )
              ),
              '[]'::jsonb
            ) AS "stockAlerts"
          FROM ingredients ing
          WHERE ing."tenantId" = $1
            AND ing.stock <= ing."minimumStock"
        ),
            category_sales_raw AS (
          -- Step A: Hitung total item per Kategori (ProductType) dan Variasi (SizeType)
          -- Kategori dengan penjualan 0 otomatis TERFILTER (tidak muncul)
          SELECT 
            p.type::text AS type,
            p.size::text AS label,
            SUM(oi.qty)::int AS count
          FROM order_items oi
          JOIN orders o ON o.id = oi.order_id
          JOIN products p ON p.id = oi.product_id
          WHERE o."tenantId" = $1
            AND o.status = 'confirmed'
            AND o.created_at >= $2
            AND o.created_at <= $3
          GROUP BY p.type, p.size
        ),
        category_sales_grouped AS (
          -- Step B: Grouping per ProductType & Aggregation Sub-Categories (Size)
          SELECT 
            csr.type,
            SUM(csr.count)::int AS count,
            jsonb_agg(
              jsonb_build_object(
                'label', csr.label,
                'count', csr.count
              )
            ) AS "subCategories"
          FROM category_sales_raw csr
          GROUP BY csr.type
        ),
        category_sales_json AS (
          -- Step C: Bungkus Seluruh Kategori menjadi 1 Array JSON
          SELECT 
            COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'type', csg.type,
                  'count', csg.count,
                  'subCategories', csg."subCategories"
                )
              ),
              '[]'::jsonb
            ) AS "productCategories"
          FROM category_sales_grouped csg
        )
        -- FINAL SELECT: Menggabungkan Seluruh CTE
        SELECT 
          os.*,
          ex."totalOpex",
          ABS(ls."totalLossNominal") AS "totalLossNominal",
          ls."totalLossCount",
          (os."totalRevenue" - os."totalCogs") AS "grossProfit",
            (
              (os."totalRevenue" - os."totalCogs") 
              - ABS(ls."totalLossNominal") 
              - ex."totalOpex"
            ) AS "netProfit",
          bs."bestSellers",
          up."userPerformances",
          sa."stockAlerts",
          cs."productCategories"
        FROM order_summary os
        CROSS JOIN opex_summary ex
        CROSS JOIN loss_summary ls
        CROSS JOIN best_sellers_json bs
        CROSS JOIN user_performances_json up
        CROSS JOIN stock_alerts_json sa
        CROSS JOIN category_sales_json cs;
`;
