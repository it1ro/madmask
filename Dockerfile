## Production image (multi-stage) with asset precompilation.
## Dev image lives in `Dockerfile.dev` and is used by docker-compose.

ARG RUBY_VERSION=3.3.10

FROM ruby:${RUBY_VERSION}-slim AS base

WORKDIR /rails

ENV LANG=C.UTF-8 \
    RAILS_ENV=production \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_WITHOUT=development:test \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      libsqlite3-0 \
      libvips42 \
      libyaml-0-2 \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      build-essential \
      git \
      libsqlite3-dev \
      libvips-dev \
      libyaml-dev \
      pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY Gemfile Gemfile.lock ./
RUN bundle install && bundle exec bootsnap precompile --gemfile

COPY . .

RUN bundle exec bootsnap precompile app/ lib/

# Precompile assets without requiring credentials in the build context.
RUN SECRET_KEY_BASE_DUMMY=1 bundle exec rails assets:precompile

FROM base

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      gosu \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1000 rails

COPY --from=build /usr/local/bundle /usr/local/bundle
COPY --from=build /rails /rails

RUN chown -R rails:rails /rails

EXPOSE 3000

ENV RAILS_LOG_TO_STDOUT=true

HEALTHCHECK --interval=5s --timeout=3s --start-period=20s --retries=12 \
  CMD curl -fsS "http://127.0.0.1:3000/up" || exit 1

ENTRYPOINT ["bin/docker-entrypoint"]

CMD ["sh", "-lc", "bin/rails db:prepare && exec bin/rails server -b 0.0.0.0 -p 3000"]
