# 铂涛疫情小区查询

[样例参考](http://www.vluee.com/)

## 部署步骤

1. 安装node和npm (参考各自操作系统版本的安装方法)
2. 进入 /var/apps (没有则创建该目录)
3. 下载源码 
```
git clone https://github.com/nimysan/corapp.git
```
4. 在 /var/apps下clone另外一个github库  
```
git clone https://github.com/bjwa2020/coronavirus.git
copy /var/apps/coronavirus /var/apps/corapp -f
```
5. 进入 /var/apps/corapp, 分别运行如下命令安装依赖包和pm2管理器
```
npm install
npm instal pm2 -g
pm2 start server.js 
# 查看启动状态
pm2 list 
pm2 logs server
```
6. 设置定时任务，每6个小时执行一下 /var/apps/corapp/update.sh 以更新疫情数据
```
第一次先执行一次
```
7. 启动后运行端口为3000, 配置nginx site代理到本服务， 以下代码供参考，
```
server {
	listen 80;
	listen [::]:80;

	server_name *.vluee.com;

	location / {
	 index index.html;
         proxy_pass http://localhost:3000/;	
         
	}
}	
```

