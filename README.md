# Readme

## Start

npm prepare

```
cd tools/converter
npm install
```

convert configs

```
cd ../../script
sh buildClient.sh
sh buildServer.sh
```

start server(only windows for now)

```
cd ../server
./runWsServer.bat
```

start client(need egret 5.2.33)

```
cd ../client
egret run -a
```
