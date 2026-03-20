import axios from 'axios'

interface ChatRequest {
  message: string
  conversationId?: string
  chatHistory?: { role: string; content: string }[]
}

interface LambdaRequest {
  question: string
  session_id: string
  chat_history: { role: string; content: string }[]
}

interface PivotColumn {
  name: string
  comment: string
}

interface PivotMetadata {
  table: string
  categorical_cols: PivotColumn[]
  numeric_cols: PivotColumn[]
}

interface LambdaResponse {
  status: string
  answer: string
  sql: string
  data: unknown[]
  tables_used: string[]
  route: string
  pivot_metadata?: PivotMetadata | null
}

interface LambdaErrorResponse {
  status: string
  node: string
  message: string
  retry_count: number
}

interface ChatResponse {
  reply: string
}

type ChatMode = 'api' | 'arn'

function getChatMode(): ChatMode {
  const mode = import.meta.env.VITE_CHAT_MODE?.trim()
  if (mode === 'arn') return 'arn'
  return 'api'
}

/**
 * pivot_metadata를 selectable-table 마크다운 코드블록으로 변환
 */
function buildPivotMarkdown(pivot: PivotMetadata): string {
  let markdown = ''

  // 1단계: 행 기준 컬럼 선택 (categorical_cols) — checkbox
  if (pivot.categorical_cols.length > 0) {
    const categoricalTable = {
      type: 'checkbox',
      title: '행 기준 컬럼 선택',
      description: '피벗 테이블의 행(Row)으로 사용할 컬럼을 선택하세요. 여러 개를 선택할 수 있습니다.',
      columns: ['컬럼명', '설명'],
      rows: pivot.categorical_cols.map((col, i) => ({
        id: `cat_${i}`,
        values: [col.name, col.comment],
      })),
      confirmText: '행 기준 선택 완료',
    }
    markdown += `\n\n### 1단계: 행 기준 컬럼 선택\n\n\`\`\`selectable-table\n${JSON.stringify(categoricalTable)}\n\`\`\``
  }

  // 2단계: 값 컬럼 선택 (numeric_cols) — checkbox
  if (pivot.numeric_cols.length > 0) {
    const numericTable = {
      type: 'checkbox',
      title: '값 컬럼 선택',
      description: '피벗 테이블의 값(Value)으로 사용할 컬럼을 선택하세요. 여러 개를 선택할 수 있습니다.',
      columns: ['컬럼명', '설명'],
      rows: pivot.numeric_cols.map((col, i) => ({
        id: `num_${i}`,
        values: [col.name, col.comment],
      })),
      confirmText: '값 컬럼 선택 완료',
    }
    markdown += `\n\n### 2단계: 값 컬럼 선택\n\n\`\`\`selectable-table\n${JSON.stringify(numericTable)}\n\`\`\``
  }

  return markdown
}

/**
 * Lambda 응답에서 에러 여부를 확인하고 ChatResponse로 변환
 * - answer 필드가 있으면 정상 처리
 * - pivot_metadata가 있으면 selectable-table 마크다운으로 변환하여 answer에 추가
 * - answer가 없으면 에러 throw
 */
function parseLambdaResponse(data: LambdaResponse | LambdaErrorResponse): ChatResponse {
  // answer 필드가 있으면 정상 응답으로 처리
  if ('answer' in data && data.answer) {
    let reply = data.answer

    // pivot_metadata가 있으면 selectable-table 마크다운 추가
    const lambdaData = data as LambdaResponse
    if (lambdaData.pivot_metadata) {
      reply += buildPivotMarkdown(lambdaData.pivot_metadata)
    }

    return { reply }
  }
  // answer가 없으면 에러 응답
  const errorData = data as LambdaErrorResponse
  throw new Error(errorData.message || 'API 호출에 실패했습니다.')
}

/**
 * API 모드: Vite dev server 프록시를 통해 Lambda Function URL 호출
 * POST /api/chat → vite.config.ts 프록시 → VITE_API_URL
 * (브라우저 CORS 제한을 우회)
 */
async function sendViaApi(data: ChatRequest): Promise<ChatResponse> {
  const lambdaPayload: LambdaRequest = {
    question: data.message,
    session_id: data.conversationId || '',
    chat_history: data.chatHistory || [],
  }
  const response = await axios.post<LambdaResponse | LambdaErrorResponse>('/api/chat', lambdaPayload, {
    headers: { 'Content-Type': 'application/json' },
  })
  return parseLambdaResponse(response.data)
}

/**
 * ARN 모드: Vite dev server 프록시를 통해 Lambda ARN 직접 호출
 * POST /api/chat → vite.config.ts 미들웨어 → AWS SDK Lambda Invoke
 */
async function sendViaArn(data: ChatRequest): Promise<ChatResponse> {
  const lambdaPayload: LambdaRequest = {
    question: data.message,
    session_id: data.conversationId || '',
    chat_history: data.chatHistory || [],
  }
  const response = await axios.post<LambdaResponse | LambdaErrorResponse>('/api/chat', lambdaPayload, {
    headers: { 'Content-Type': 'application/json' },
  })
  return parseLambdaResponse(response.data)
}

export const chatApi = {
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const mode = getChatMode()
    return mode === 'arn' ? sendViaArn(data) : sendViaApi(data)
  },

  /** 현재 설정된 채팅 모드 반환 */
  getMode: getChatMode,
}
