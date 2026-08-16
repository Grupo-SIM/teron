# Simintpay workspace dunning

- [x] Simintpay: contrato, webhook, dunning e recuperação.
- [x] Teron: projeção de estado e webhook autenticado.
- [x] Testes, validação e commits atômicos.

Validação: `simintpay-back: bun run build`; `teron: bunx tsc --noEmit -p services/payment/pod-payment/tsconfig.json`.
O typecheck completo de `server/account` possui erros anteriores neste worktree.
