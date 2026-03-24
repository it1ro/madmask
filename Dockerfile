# Development image: Ruby 3.2, SQLite tooling, Bundler.
# Node.js is omitted — Tailwind is provided by tailwindcss-rails (see OVERVIEW.md).

FROM ruby:3.2-slim

ENV LANG=C.UTF-8 \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      build-essential \
      ca-certificates \
      curl \
      git \
      libsqlite3-dev \
      libyaml-dev \
      pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Ensure Bundler is available explicitly (base image may ship an older pin).
RUN gem install bundler --no-document

WORKDIR /app

COPY entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
# Shell keeps the container alive when no command is passed; compose will override.
CMD ["bash"]
