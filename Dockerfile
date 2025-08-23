# base image
FROM node:22-alpine

# set workdir
WORKDIR /usr/src/app

# copy package.json
COPY package*.json ./

# install deps
RUN npm install --production

# copy source code
COPY . .

# build ()
RUN npm run build

# expose port
EXPOSE 3000

# start app
CMD ["node", "dist/main.js"]