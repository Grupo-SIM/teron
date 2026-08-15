FROM hardcoreeng/base-slim:v20250916
WORKDIR /usr/src/app

ARG TERON_WORKSPACE_SEAT_AMOUNT=9.99
# The commercial price is versioned with this image, alongside the frontend.
ENV SIMINTPAY_WORKSPACE_SEAT_AMOUNT=${TERON_WORKSPACE_SEAT_AMOUNT}

COPY bundle/bundle.js ./

EXPOSE 3000
CMD [ "node", "bundle.js" ]
