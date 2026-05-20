# VDO HUB — Documentação Técnica Completa

> Última atualização: Maio 2026  
> Desenvolvido por: Johni Michael / Carlos

---

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura e Serviços](#2-arquitetura-e-serviços)
3. [Variáveis de Ambiente](#3-variáveis-de-ambiente)
4. [Banco de Dados](#4-banco-de-dados)
5. [Fluxo de Reserva Completo](#5-fluxo-de-reserva-completo)
6. [Controle de Acesso — iDFace](#6-controle-de-acesso--idface)
7. [Rede Local — iDConnect](#7-rede-local--idconnect)
8. [Tunnel Cloudflare](#8-tunnel-cloudflare)
9. [Pagamentos — ASAAS](#9-pagamentos--asaas)
10. [Agendamento — QStash](#10-agendamento--qstash)
11. [Emails — Resend](#11-emails--resend)
12. [Painel Administrativo](#12-painel-administrativo)
13. [Deploy e Atualizações](#13-deploy-e-atualizações)
14. [Manutenção e Troubleshooting](#14-manutenção-e-troubleshooting)

---

## 1. Visão Geral do Sistema

O VDO HUB é um sistema de aluguel de sala comercial por período com:
- Reserva e pagamento online
- Reconhecimento facial para acesso à sala
- Liberação/revogação automática de acesso no horário da reserva
- Painel administrativo completo

**URL do site:** https://vdohub.viverdeobra.com  
**URL do admin:** https://vdohub.viverdeobra.com/admin

---

## 2. Arquitetura e Serviços

### Stack principal
| Camada | Tecnologia |
|--------|-----------|
| Frontend + Backend | Next.js 16 (App Router) |
| Banco de dados | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Deploy | Vercel |
| Estilização | Tailwind CSS + Framer Motion |
| Autenticação admin | NextAuth v5 |

### Serviços externos
| Serviço | Uso | URL/Dashboard |
|---------|-----|---------------|
| **Vercel** | Hospedagem e deploy | vercel.com |
| **Supabase** | Banco de dados PostgreSQL | supabase.com |
| **ASAAS** | Pagamentos com cartão | asaas.com |
| **Resend** | Envio de emails | resend.com |
| **Upstash QStash** | Agendamento de webhooks | upstash.com |
| **Cloudflare** | DNS + Tunnel | cloudflare.com |
| **Control iD iDFace** | Reconhecimento facial / Fechadura | Hardware local |
| **Control iD iDConnect** | Gateway WiFi-Ethernet para iDFace | Hardware local |

---

## 3. Variáveis de Ambiente

Todas configuradas em **Vercel → Settings → Environment Variables**:

```env
# Banco de dados
DATABASE_URL=postgresql://...supabase.com.../postgres

# Autenticação admin (NextAuth)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://vdohub.viverdeobra.com

# ASAAS (pagamentos)
ASAAS_API_KEY=...
ASAAS_BASE_URL=https://api.asaas.com/v3   # ou sandbox: https://sandbox.asaas.com/api/v3

# Resend (emails)
RESEND_API_KEY=...

# URLs do site
NEXT_PUBLIC_BASE_URL=https://vdohub.viverdeobra.com

# Control iD iDFace
CONTROLID_URL=http://ob55et1.idconnect.controlid.com.br
CONTROLID_LOGIN=vdohub
CONTROLID_PASSWORD=230326

# QStash (agendamento de acesso)
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...
QSTASH_URL=https://qstash-us-east-1.upstash.io

# Cron (não usado atualmente — QStash substituiu)
CRON_SECRET=vdoH#b$Kr9!mX2q@Lp7cR
```

---

## 4. Banco de Dados

### Modelos principais

**Client** — Clientes cadastrados  
- `id`, `name`, `email`, `phone`, `cpf`
- `facePhoto` — foto base64 capturada no checkout
- `controlidUserId` — ID do usuário no iDFace (preenchido após cadastro facial)

**Booking** — Reservas HUB ONE (período único)  
- `clientId`, `startAt`, `endAt`
- `totalAmount`, `discountAmount`, `voucherId`
- `asaasChargeId`, `asaasPaymentUrl`
- `status`: `PENDING` → `PAID` → `ACTIVE` → `COMPLETED` | `CANCELLED`

**Subscription** — Assinaturas multi-período (HUB FIVE, TEN, PARTNER)  
- `clientId`, `planKey`, `totalCredits`, `usedCredits`
- `expiresAt`, `token` (para portal do cliente)
- `status`: `ACTIVE` | `EXPIRED` | `CANCELLED`

**Voucher** — Cupons de desconto  
- `code`, `discountType` (PERCENTAGE | FIXED), `discountValue`
- `maxUses`, `usedCount`, `expiresAt`

**Lead** — Leads incompletos (step 2 sem finalizar pagamento)  
- `name`, `email`, `phone`, `cpf`, `planKey`

**Setting** — Configurações dinâmicas  
- `key` + `value` (JSON string)
- Chaves usadas: `plans` (preços dos planos), `terms` (termos de uso)

### Comandos Prisma

```bash
# Aplicar mudanças no schema ao banco
npx prisma db push

# Gerar cliente Prisma após mudanças
npx prisma generate

# Ver banco via interface visual
npx prisma studio
```

---

## 5. Fluxo de Reserva Completo

### HUB ONE (período único)

```
1. Cliente acessa /reservar
2. Seleciona HUB ONE + data/horário
3. Preenche dados pessoais (lead salvo silenciosamente)
4. Escolhe parcelamento, insere dados do cartão, aceita termos
5. POST /api/bookings → cobra ASAAS → cria Booking (status PAID)
6. Cadastra foto do rosto (câmera do browser)
7. PATCH /api/bookings/[id]/facial →
   a. Salva foto no banco (client.facePhoto)
   b. Cria usuário no iDFace via API
   c. Envia foto para iDFace
   d. Agenda grant no QStash para startAt
   e. Agenda revoke no QStash para endAt
   f. Envia email de confirmação
8. No horário startAt → QStash dispara POST /api/access/grant
   a. Ativa usuário no iDFace (begin_time=agora, end_time=+10anos)
   b. Booking status → ACTIVE
9. No horário endAt → QStash dispara POST /api/access/revoke
   a. Desativa usuário no iDFace (end_time=passado)
   b. Booking status → COMPLETED
```

### HUB FIVE / TEN / PARTNER (multi-período)

```
1-4. Igual ao HUB ONE (sem seleção de data)
5. POST /api/bookings → cobra ASAAS → cria Subscription (status ACTIVE)
6. Cadastra foto do rosto
7. PATCH /api/bookings/[subscriptionId]/facial (isSubscription=true)
   a. Salva foto e registra no iDFace
   b. Envia email com link do portal /minha-conta/[token]
8. Cliente acessa portal e agenda períodos usando os créditos
```

---

## 6. Controle de Acesso — iDFace

### Equipamento
- **Modelo:** Control iD iDFace
- **Função:** Câmera de reconhecimento facial que controla a fechadura da sala
- **Acesso à API:** via cloud relay do iDConnect

### URL de acesso à API
```
http://ob55et1.idconnect.controlid.com.br
```
> ⚠️ Esta URL é gerada pelo iDConnect e pode mudar se o dispositivo for resetado.  
> Para verificar a URL atual: acesse http://192.168.1.82 (rede local) → Encaminhamento Remoto.

### Credenciais do iDFace
- **Login:** vdohub  
- **Senha:** 230326

### Endpoints da API iDFace

```
POST /login.fcgi
Body: {"login":"vdohub","password":"230326"}
Retorna: {"session":"TOKEN"}
```

> Todos os endpoints seguintes precisam de `?session=TOKEN` na URL.

```
# Criar usuário
POST /create_objects.fcgi?session=TOKEN
Body: {"object":"users","values":[{"name":"Nome","registration":"clientId","password":""}]}
Retorna: {"ids":[123]}

# Enviar foto facial (base64, sem prefixo data:image)
POST /user_set_image_list.fcgi?session=TOKEN
Body: {"match":true,"user_images":[{"user_id":123,"timestamp":UNIX,"image":"base64..."}]}
Retorna: {"results":[{"user_id":123,"success":true,"errors":""}]}

# Ativar acesso (begin_time=agora, end_time=+10anos)
POST /modify_objects.fcgi?session=TOKEN
Body: {"object":"users","values":{"begin_time":NOW,"end_time":FAR_FUTURE},"where":{"users":{"id":123}}}

# Desativar acesso (end_time=passado)
POST /modify_objects.fcgi?session=TOKEN
Body: {"object":"users","values":{"end_time":PAST},"where":{"users":{"id":123}}}

# Listar usuários
POST /load_objects.fcgi?session=TOKEN
Body: {"object":"users","fields":["id","name","registration","begin_time","end_time"]}

# Deletar usuário
POST /destroy_objects.fcgi?session=TOKEN
Body: {"object":"users","where":{"users":{"id":123}}}
```

### Código da integração
- **Cliente API:** `src/lib/controlid/client.ts`
- **Registro no checkout:** `src/app/api/bookings/[id]/facial/route.ts`
- **Liberação de acesso:** `src/app/api/access/grant/route.ts`
- **Revogação de acesso:** `src/app/api/access/revoke/route.ts`

### Requisitos da foto facial
- Rosto de **frente**, bem **centralizado** e **iluminado**
- Formato JPEG, base64 sem prefixo
- O iDFace rejeita fotos sem face detectável (`success: false`)

---

## 7. Rede Local — iDConnect

### Topologia de rede
```
Internet
   ↓
Roteador WiFi principal (IP: 192.168.0.1)
   ↓ (WiFi)
iDConnect (IP WiFi: 192.168.1.82)
   ↓ (Ethernet — rede interna 192.168.0.x)
iDFace (IP: 192.168.0.178)
   ↓
Fechadura elétrica
```

### iDConnect
- **Função:** Bridge WiFi→Ethernet, expõe iDFace via cloud relay
- **IP na rede local:** 192.168.1.82
- **Painel de administração:** http://192.168.1.82 (acessível da rede WiFi)
- **Cloud relay:** Configurado em Encaminhamento Remoto → gera URL `ob55et1.idconnect.controlid.com.br`

### PC com Cloudflare Tunnel
- **Função:** Expõe o iDConnect via internet (para o domínio `fechadura.vdohub.viverdeobra.com`)
- **Serviço:** `cloudflared` instalado como serviço Windows
- **Rota estática configurada:** `192.168.0.0/24 via 192.168.1.82` (para rotear ao iDFace)
- **Nota:** O PC precisa ficar **ligado 24h** para o tunnel funcionar

> ⚠️ A integração principal usa a URL cloud do iDConnect (`ob55et1.idconnect.controlid.com.br`), não o tunnel Cloudflare. O tunnel Cloudflare expõe o iDConnect para acesso manual/debug.

---

## 8. Tunnel Cloudflare

### Configuração
- **Dashboard:** one.dash.cloudflare.com → Zero Trust → Networks → Tunnels
- **Domínio exposto:** `fechadura.vdohub.viverdeobra.com`
- **Service URL:** `http://192.168.1.82` (iDConnect)
- **Serviço Windows:** `cloudflared` no PC do cliente

### Reinstalar o serviço cloudflared (se necessário)
```powershell
# No PC onde o cloudflared está instalado (como Administrador)
# 1. Baixar cloudflared.exe em https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# 2. Instalar como serviço com o token do Cloudflare Zero Trust
& "caminho\cloudflared.exe" service install TOKEN_DO_CLOUDFLARE

# 3. Verificar status
sc query cloudflared
```

### Verificar se o tunnel está online
```powershell
Invoke-WebRequest -Uri "http://fechadura.vdohub.viverdeobra.com/" -UseBasicParsing
```

---

## 9. Pagamentos — ASAAS

### Configuração
- **Ambiente:** Produção (`https://api.asaas.com/v3`)
- **Método:** Cartão de crédito com tokenização
- **Parcelamento:** Até 3x (HUB ONE) ou 10x (demais planos) sem juros

### Fluxo de pagamento
1. Cria cliente no ASAAS (`POST /customers`)
2. Cria cobrança com cartão tokenizado (`POST /payments`)
3. ASAAS processa e retorna status imediato

### Código
- **Cliente API:** `src/lib/asaas/client.ts`
- **Integração:** `src/app/api/bookings/route.ts`

### Webhooks ASAAS (não implementado — pagamento é síncrono)
O sistema usa cobrança síncrona, então não precisa de webhook para confirmar pagamento.

---

## 10. Agendamento — QStash

### O que é
Upstash QStash é um serviço de mensagens agendadas. Quando uma reserva é confirmada, o sistema agenda dois webhooks:
- **Grant:** disparado no `startAt` da reserva → libera acesso
- **Revoke:** disparado no `endAt` da reserva → revoga acesso

### Dashboard
- **URL:** upstash.com → QStash
- **Região:** US East (us-east-1)
- **Plano:** Free (até 500 mensagens/dia, delay máx. 7 dias)

### Endpoints do sistema
- `POST /api/access/grant` — recebe webhook do QStash, ativa usuário no iDFace
- `POST /api/access/revoke` — recebe webhook do QStash, desativa usuário no iDFace

### Comportamento em caso de falha
- Se o endpoint retornar `500`, o QStash **retenta automaticamente** (até 3 vezes)
- Se o PC com cloudflared estiver offline, o grant vai falhar e ser retentado
- Quando o PC voltar, o retry vai funcionar

### Limitação do plano free
- Delay máximo de **7 dias** — reservas com mais de 7 dias de antecedência falharão no agendamento
- Para reservas futuras distantes, considere upgrade para plano pago

### Código
- **Agendamento:** `src/lib/qstash.ts`
- **Grant:** `src/app/api/access/grant/route.ts`
- **Revoke:** `src/app/api/access/revoke/route.ts`

---

## 11. Emails — Resend

### Emails enviados pelo sistema
| Evento | Email |
|--------|-------|
| Reserva HUB ONE confirmada | Confirmação com data/horário e valor |
| Assinatura multi-período confirmada | Link do portal + créditos disponíveis |

### Código
- `src/lib/resend/emails.ts`

---

## 12. Painel Administrativo

**URL:** https://vdohub.viverdeobra.com/admin  
**Login:** configurado via NextAuth (email/senha definidos no Supabase ou variável de ambiente)

### Seções do admin

| Seção | Rota | Função |
|-------|------|--------|
| Dashboard | /admin | Métricas: receita, reservas, ocupação |
| Reservas | /admin/reservas | Lista todas as reservas HUB ONE |
| Assinaturas | /admin/assinaturas | Lista planos multi-período |
| Clientes | /admin/clientes | Lista clientes, painel lateral com histórico |
| Vouchers | /admin/vouchers | Criar/gerenciar cupons de desconto |
| Leads | /admin/leads | Leads que não finalizaram o pagamento |
| Planos | /admin/planos | Editar preços e créditos dos planos |
| Configurações | /admin/configuracoes | Termos de uso (editor de texto) |

### Editar preços dos planos
1. Acesse /admin/planos
2. Edite preço, créditos, validade ou parcelamento
3. Clique em "Salvar alterações"
4. O site atualiza automaticamente em tempo real

### Editar termos de uso
1. Acesse /admin/configuracoes
2. Edite o texto dos termos
3. Clique em "Salvar"
4. O checkbox no checkout e a página /termos atualizam automaticamente

---

## 13. Deploy e Atualizações

### Fluxo de deploy
```
Código local → git commit → git push → GitHub → Vercel (deploy automático)
```

### Fazer uma atualização
```bash
# 1. Fazer as alterações no código
# 2. Testar localmente
npm run dev

# 3. Commitar e enviar
git add .
git commit -m "descrição da alteração"
git push

# 4. Vercel faz o deploy automaticamente
# Acompanhe em: vercel.com → projeto → Deployments
```

### Mudança no banco de dados (schema Prisma)
```bash
# 1. Editar prisma/schema.prisma
# 2. Aplicar ao banco
npx prisma db push

# 3. Regenerar o cliente
npx prisma generate

# 4. Commitar o schema atualizado
git add prisma/schema.prisma
git commit -m "feat: atualizar schema"
git push
```

### Executar deploy manual via CLI
```bash
# Instalar Vercel CLI (se necessário)
npm install -g vercel

# Login
npx vercel login

# Deploy em produção
npx vercel --prod
```

---

## 14. Manutenção e Troubleshooting

### O site está fora do ar
1. Verificar **vercel.com → Deployments** — deploy com erro?
2. Verificar **Supabase** — banco online?
3. Verificar **Cloudflare DNS** — CNAME `vdohub → cname.vercel-dns.com` existe?

### A fechadura não está abrindo
1. Verificar se o **PC com cloudflared está ligado e com internet**
2. Acessar `http://fechadura.vdohub.viverdeobra.com` — responde?
3. Verificar **iDFace** pelo painel: `ob55et1.idconnect.controlid.com.br`
4. Verificar **QStash Logs** — o grant foi disparado? Retornou erro?
5. Verificar **Vercel Logs** — erro no `/api/access/grant`?

### A URL do iDConnect mudou (ob55et1... não funciona)
1. Acessar `http://192.168.1.82` na rede local
2. Ir em **Encaminhamento Remoto**
3. Copiar a nova URL gerada
4. Atualizar `CONTROLID_URL` na Vercel
5. Fazer redeploy

### Foto não está sendo aceita pelo iDFace (`success: false`)
- A foto precisa ter o rosto **de frente, centralizado e bem iluminado**
- Testar manualmente no painel do iDFace: Cadastrar → Usuários → Editar → Foto

### Reserva não recebeu email de confirmação
1. Verificar **Resend dashboard** — email foi enviado?
2. Verificar spam do cliente
3. Verificar **Vercel Logs** — erro no envio?

### Pagamento recusado
- O ASAAS retorna a mensagem de erro diretamente ao cliente no checkout
- Verificar **ASAAS dashboard** → Cobranças para detalhes

### Voucher não está funcionando
- Verificar em /admin/vouchers: ativo? expirado? limite de usos atingido?
- Vouchers só funcionam para HUB ONE

### Adicionar novo admin
- Configurar via NextAuth no arquivo `src/app/api/auth/[...nextauth]/route.ts`
- Ou via variável de ambiente dependendo da configuração de autenticação

### Backup do banco de dados
- Supabase faz backup automático diário (plano free: 7 dias de retenção)
- Para backup manual: Supabase → projeto → Database → Backups

---

## Contatos e Repositórios

- **Repositório GitHub:** https://github.com/VDOHUB/sala-comercial
- **Vercel:** https://vercel.com (login com conta GitHub)
- **Supabase:** https://supabase.com
- **Upstash:** https://upstash.com
- **ASAAS:** https://asaas.com
- **Cloudflare:** https://one.dash.cloudflare.com
