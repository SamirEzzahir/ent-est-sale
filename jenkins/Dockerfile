FROM jenkins/jenkins:lts

USER root

RUN apt-get update && apt-get install -y \
    docker.io \
    docker-compose \
    git \
    curl \
    bash \
    python3 \
    python3-pip \
    nodejs \
    npm \
    && apt-get clean

USER jenkins