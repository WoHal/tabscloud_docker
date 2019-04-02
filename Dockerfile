FROM node
EXPOSE 8033
RUN apt update && \
    apt install redis-server -y && \
    redis-server --daemonize yes
CMD npm install && npm start
