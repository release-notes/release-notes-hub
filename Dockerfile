FROM node:6

COPY package.json /usr/src/app/package.json
RUN cd /usr/src/app && npm install

# add rest of source
COPY . /usr/src/app

# build public assets
RUN cd /usr/src/app && node_modules/gulp/bin/gulp.js build

WORKDIR /usr/src/app
CMD ["npm", "start"]

EXPOSE 8080
USER www-data
