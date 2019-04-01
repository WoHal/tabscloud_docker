FROM ubuntu:16.04

RUN apt updte && apt install nodejs

COPY ./server /home

RUN cd /home/server && npm install && npm start