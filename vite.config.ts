import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'

/**
 * ARN 모드: Vite dev server 미들웨어로 Lambda를 직접 호출하는 프록시
 * POST /api/chat 요청을 받아 AWS SDK로 Lambda Invoke 수행
 */
function lambdaArnProxy(): Plugin {
  return {
    name: 'lambda-arn-proxy',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const env = loadEnv('', process.cwd(), 'VITE_')
        const chatMode = env.VITE_CHAT_MODE
        const lambdaArn = env.VITE_LAMBDA_ARN
        const region = env.VITE_AWS_REGION || 'ap-northeast-2'
        const profile = env.VITE_AWS_PROFILE || 'default'

        if (chatMode !== 'arn' || !lambdaArn) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'ARN 모드가 설정되지 않았습니다. .env 파일을 확인하세요.' }))
          return
        }

        // Request body 읽기
        let body = ''
        for await (const chunk of req) {
          body += chunk
        }

        try {
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
        } catch (err: unknown) {
          console.error('[ARN Proxy Error]', err)
          const message = err instanceof Error ? err.message : 'Lambda 호출 실패'
          res.statusCode = 500
          res.end(JSON.stringify({ error: message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    lambdaArnProxy(),
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
