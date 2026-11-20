#!/usr/bin/env bash
# Teste da função cep-conta contra o projeto real. Uso:
#   bash supabase/tests/cep-conta.sh   (opcional: EMAIL_EQUIPE=<e-mail de crm_equipe> para testar o bloqueio)
# Depois, apague o usuário de teste (comando no fim da saída).
set -u
URL=https://kerssctooyqryzofbrzd.supabase.co
ANON=$(grep -o 'eyJ[^"]*' v1/config.js)
F="$URL/functions/v1/cep-conta"
EMAIL="teste-cep-v2-$(date +%s)@example.com"
falhas=0
confere() { if [ "$2" = "$3" ]; then echo "PASS $1 ($3)"; else echo "FAIL $1: esperado $2, obtido $3"; falhas=$((falhas+1)); fi; }
post() { curl -s -o /tmp/cep-conta-resp -w "%{http_code}" -X POST "$F" -H "Content-Type: application/json" -H "apikey: $ANON" "$@"; }

confere "cadastro válido" 200 "$(post -d "{\"acao\":\"cadastro\",\"nome\":\"Teste Automatico\",\"email\":\"$EMAIL\",\"senha\":\"SenhaTeste#2027\"}")"
confere "cadastro repetido" 409 "$(post -d "{\"acao\":\"cadastro\",\"nome\":\"Teste Automatico\",\"email\":\"$EMAIL\",\"senha\":\"SenhaTeste#2027\"}")"
if [ -n "${EMAIL_EQUIPE:-}" ]; then
  confere "e-mail da equipe do escritório" 403 "$(post -d "{\"acao\":\"cadastro\",\"nome\":\"Equipe\",\"email\":\"${EMAIL_EQUIPE}\",\"senha\":\"SenhaTeste#2027\"}")"
else echo "SKIP e-mail da equipe (defina EMAIL_EQUIPE para testar)"; fi
confere "senha curta" 400 "$(post -d '{"acao":"cadastro","nome":"Teste","email":"curta@example.com","senha":"123"}')"
confere "redefinir sem login" 401 "$(post -d '{"acao":"redefinir","userId":"00000000-0000-0000-0000-000000000000","novaSenha":"SenhaTeste#2027"}')"
TOKEN=$(curl -s -X POST "$URL/auth/v1/token?grant_type=password" -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"SenhaTeste#2027\"}" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
confere "login da conta criada" 1 "$([ -n "$TOKEN" ] && echo 1 || echo 0)"
confere "aluna comum tenta redefinir senha" 403 "$(post -H "Authorization: Bearer $TOKEN" -d '{"acao":"redefinir","userId":"00000000-0000-0000-0000-000000000000","novaSenha":"SenhaTeste#2027"}')"
PERFIL=$(curl -s "$URL/rest/v1/cep_profiles?select=nome" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN")
confere "perfil criado e visível só para ela" '[{"nome":"Teste Automatico"}]' "$PERFIL"
CICLO=$(curl -s "$URL/rest/v1/cep_cycles?select=ano,status" -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN")
confere "ciclo 2027 ativo" '[{"ano":2027,"status":"ativo"}]' "$CICLO"
echo "LIMPEZA: delete from auth.users where email = '$EMAIL' and raw_user_meta_data->>'origem' = 'cep';"
[ $falhas -eq 0 ]
