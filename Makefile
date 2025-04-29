ACCESS_TOKEN_USR ?= nothing
ACCESS_TOKEN_PWD ?= nothing

.PHONY: test
test:
	npm install --also=dev
	npm test

.PHONY: docker-build-mcp-server
docker-build-mcp-server:
	docker buildx build -f Dockerfile --build-arg ACCESS_TOKEN_USR=${ACCESS_TOKEN_USR} --build-arg ACCESS_TOKEN_PWD=${ACCESS_TOKEN_PWD} -t docker.io/library/tempimage .
