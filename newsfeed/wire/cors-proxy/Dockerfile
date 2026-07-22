FROM node:22-alpine
WORKDIR /app
RUN npm install cors-anywhere@0.4.4
EXPOSE 7824
CMD ["node", "-e", "require('cors-anywhere').createServer({originWhitelist:[]}).listen(7824,'0.0.0.0')"]
