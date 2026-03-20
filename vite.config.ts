import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'

/**
 * Chat API 프록시: Vite dev server 미들웨어
 * POST /api/chat 요청을 받아 모드에 따라 처리:
 *   - api 모드: VITE_API_URL로 HTTP 프록시 (CORS 우회)
 *   - arn 모드: AWS SDK로 Lambda Invoke 직접 호출
 */
function chatApiProxy(): Plugin {
  return {
    name: 'chat-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const env = loadEnv('', process.cwd(), 'VITE_')
        const chatMode = env.VITE_CHAT_MODE?.trim()

        // Request body 읽기
        let body = ''
        for await (const chunk of req) {
          body += chunk
        }

        try {
          if (chatMode === 'api') {
            await handleApiMode(env, body, res)
          } else if (chatMode === 'arn') {
            await handleArnMode(env, body, res)
          } else {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'VITE_CHAT_MODE가 api 또는 arn으로 설정되지 않았습니다.' }))
          }
        } catch (err: unknown) {
          console.error(`[Chat Proxy Error - ${chatMode}]`, err)
          const message = err instanceof Error ? err.message : 'API 호출 실패'
          res.statusCode = 500
          res.end(JSON.stringify({ error: message }))
        }
      })
    },
  }
}

/** API 모드: VITE_API_URL로 HTTP 프록시 (CORS 우회) */
async function handleApiMode(
  env: Record<string, string>,
  body: string,
  res: import('node:http').ServerResponse,
) {
  const apiUrl = env.VITE_API_URL
  if (!apiUrl) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'VITE_API_URL이 설정되지 않았습니다. .env 파일을 확인하세요.' }))
    return
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  const data = await response.text()
  res.setHeader('Content-Type', 'application/json')
  res.statusCode = response.status
  res.end(data)
}

/** ARN 모드: AWS SDK로 Lambda Invoke 직접 호출 */
async function handleArnMode(
  env: Record<string, string>,
  body: string,
  res: import('node:http').ServerResponse,
) {
  const lambdaArn = env.VITE_LAMBDA_ARN
  const region = env.VITE_AWS_REGION || 'ap-northeast-2'
  const profile = env.VITE_AWS_PROFILE || 'default'

  if (!lambdaArn) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'VITE_LAMBDA_ARN이 설정되지 않았습니다. .env 파일을 확인하세요.' }))
    return
  }

  const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda')
  const { fromIni } = await import('@aws-sdk/credential-providers')

  const client = new LambdaClient({
    region,
    credentials: fromIni({ profile }),
  })

  const command = new InvokeCommand({
    FunctionName: lambdaArn,
    InvocationType: 'RequestResponse',
    Payload: new TextEncoder().encode(body),
  })

  const response = await client.send(command)
  const payload = response.Payload
    ? new TextDecoder().decode(response.Payload)
    : '{}'

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(payload)
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    chatApiProxy(),
  ],
  server: {
    port: 3003,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
  },
})
