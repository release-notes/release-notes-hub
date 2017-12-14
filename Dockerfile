FROM node:8

COPY package.json /usr/src/app/package.json
COPY yarn.lock /usr/src/app/yarn.lock
RUN cd /usr/src/app && yarn

# add rest of source
COPY . /usr/src/app

# build public assets
RUN cd /usr/src/app && yarn build

WORKDIR /usr/src/app
CMD ["yarn", "start"]

EXPOSE 8080
USER www-data
