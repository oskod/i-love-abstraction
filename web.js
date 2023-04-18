const http = require("node:http");
const https = require("node:https");

class Route {
	routes = {};
	handlers = {};

	addMethod(method, handler) {
		if (this.handlers[method]) {
			return console.error(`Method ${method} is already occupied.`);
		}
		this.handlers[method] = handler;

		return this;
	}

	addRoute(routePath, route) {
		if (routePath.length > 1) {
			let foundRoute = this.routes[routePath[0]];
			if (!foundRoute) {
				foundRoute = new Route();
				this.routes[routePath[0]] = foundRoute;
			}
			foundRoute.addRoute(routePath.splice(1), route);
		} else {
			this.routes[routePath[0]] = route;
		}

		return this;
	}

	handleRequest(routePath, req, res) {
		console.log(routePath);
		const method = req.method;
		const foundStarter = this.routes["*"];

		if (foundStarter) {
			const foundHandler = foundStarter.handlers[req.method];

			if (foundHandler) {
				if (foundHandler(req, res) !== true) {
					return;
				}
			}
		}

		if (routePath.length > 0) {
			const foundRoute = this.routes[routePath[0]];
			console.log(foundRoute);
			if (!foundRoute) {
				const foundEnder = this.routes["**"];
				if (foundEnder) {
					const foundHandler = foundEnder.handlers[req.method];

					if (foundHandler) {
						return foundHandler(req, res);
					}
				}

				res.writeHead(404);
				res.end("Not found");

				return;
			}

			return foundRoute.handleRequest(routePath.splice(1), req, res);
		}

		const foundHandler = this.handlers[method];
		console.log(method, foundHandler);

		if (!foundHandler) {
			res.writeHead(404);
			res.end("Not found");

			return;
		} else {
			return foundHandler(req, res);
		}
	}
}

class WebServer {
	app = null;

	constructor(isHttps) {
		const currentServer = this;
		this.app = (isHttps ? https : http).createServer(function(req, res) {
			currentServer.handleRequest(req, res);
		});
		this.rootRoute = new Route();
	}

	listen(...args) {
		return this.app.listen(...args)
	}

	addRoute(routeStr) {
		if (routeStr[0] === "/") {
			routeStr = routeStr.substring(1);
		}

		const routePath = routeStr.split("/");

		const route = new Route();
		this.rootRoute.addRoute(routePath, route);

		return route;
	}

	handleRequest(req, res) {
		const path = req.url.slice(1).split("?")[0].split("/");

		this.rootRoute.handleRequest(path, req, res);
	}
}

module.exports = {WebServer, Route};
