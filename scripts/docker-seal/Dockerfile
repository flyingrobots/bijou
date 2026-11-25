ARG BASE_IMAGE=node:22-bookworm@sha256:63538dfe497cc29dfafdda25ada09b46db68a3f4cc205abf1f5d6bf0913f3384
FROM ${BASE_IMAGE}
# Toolchain only. No RUN, dependency cache, source tree or completed build layer.
COPY --chmod=0444 marker /etc/bijou-test-seal
USER 1000:1000
WORKDIR /work/source
ENV HOME=/home/test TMPDIR=/tmp LANG=C.UTF-8 GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null
CMD ["sleep", "infinity"]
