# Configuração de Variáveis de Ambiente no Vercel

Para que o sistema funcione corretamente, você precisa adicionar as seguintes variáveis de ambiente no painel do Vercel.

## 1. Acesse o Painel do Vercel
1. Vá para: https://vercel.com/dashboard
2. Selecione o projeto `producao-imac` (ou o nome que você deu)
3. Vá em **Settings** -> **Environment Variables**

## 2. Adicione as Variáveis

Adicione as seguintes chaves e valores:

| Key | Value | Descrição |
|-----|-------|-----------|
| `DATABASE_URL` | `postgresql://postgres:SuaSenha@db.xxx.supabase.co:6543/postgres` | **Use a porta 6543 (Pooler)** que você configurou no `.env` |
| `JWT_SECRET` | (Gere uma string aleatória longa) | Segredo para assinar tokens |
| `JWT_REFRESH_SECRET` | (Gere outra string aleatória longa) | Segredo para refresh tokens |
| `CORS_ORIGIN` | `https://producao-imac.vercel.app` | URL do seu frontend em produção (sem barra no final) |
| `VITE_API_URL` | `https://producao-imac.vercel.app/api` | URL da API para o Frontend conectar |

### Dicas:
* Para `JWT_SECRET` e `JWT_REFRESH_SECRET`, você pode digitar chaves aleatórias como teclado (ex: `j9s8d7f6g5h4j3k2l1...`) ou usar um gerador de senha.
* **IMPORTANTE:** Certifique-se que `DATABASE_URL` está usando a porta **6543** (Transaction Pooler) para produção, para evitar erros de conexão.

## 3. Redeploy
Após adicionar as variáveis, você precisará fazer um novo deploy para que elas tenham efeito.
* Vá em **Deployments**
* Clique no último deploy (que pode ter falhado)
* Clique em **Redeploy**

---

**Me avise quando tiver configurado as variáveis!**
