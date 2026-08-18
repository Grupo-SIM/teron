FROM --platform=$BUILDPLATFORM rust:1.88 AS builder
ARG TARGETPLATFORM

WORKDIR /tmp/build

RUN \
    if [ "$TARGETPLATFORM" = "linux/arm64" ]; then \
        apt-get update && apt-get install -y \
        gcc-aarch64-linux-gnu \
        g++-aarch64-linux-gnu \
        libc6-dev-arm64-cross \
        && rm -rf /var/lib/apt/lists/* ; \
\
        rustup target add aarch64-unknown-linux-gnu ; \
    elif [ "$TARGETPLATFORM" != "linux/amd64" ]; then \
        echo "Unexpected target platform: $TARGETPLATFORM" && exit 1 ; \
    fi

ENV CC_aarch64_unknown_linux_gnu=aarch64-linux-gnu-gcc \
    CXX_aarch64_unknown_linux_gnu=aarch64-linux-gnu-g++ \
    CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc

# Compile third-party crates in a layer that remains valid when only application
# sources change. Replacing the stub below invalidates the local crate while
# preserving Cargo's compiled dependency graph.
COPY Cargo.toml Cargo.lock ./
RUN mkdir src \
    && printf 'fn main() {}\n' > src/main.rs \
    && if [ "$TARGETPLATFORM" = "linux/amd64" ]; then \
        cargo build --locked --release --target=x86_64-unknown-linux-gnu ; \
    else \
        cargo build --locked --release --target=aarch64-unknown-linux-gnu ; \
    fi

COPY src ./src
RUN touch src/main.rs \
    && if [ "$TARGETPLATFORM" = "linux/amd64" ]; then \
        cargo build --locked --release --target=x86_64-unknown-linux-gnu ; \
    else \
        cargo build --locked --release --target=aarch64-unknown-linux-gnu ; \
    fi

FROM debian:12-slim

ARG TARGET
COPY --from=builder /tmp/build/target/*/release/hulypulse /usr/local/bin/hulypulse
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["/usr/local/bin/hulypulse"]
