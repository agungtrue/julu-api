export enum StockMutationType {
  RESTOCK_IN = 'RESTOCK_IN', // Barang masuk / pembelian baru
  USAGE_OUT = 'USAGE_OUT', // Barang keluar otomatis via checkout order kasir
  LOSS = 'LOSS', // Basi, tumpah, rusak, expired, hilang
  ADJUSTMENT = 'ADJUSTMENT', // Selisih penyesuaian dari Stock Opname
  CANCEL = 'CANCEL',
}
