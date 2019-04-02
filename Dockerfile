FROM node
COPY . /server
WORKDIR /server
RUN npm install
CMD nodejs index.js