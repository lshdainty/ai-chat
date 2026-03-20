import axios from 'axios'

interface ChatRequest {
  message: string
  conversationId?: string
}

interface ChatResponse {
  reply: string
}

type ChatMode = 'mock' | 'api' | 'arn'

function getChatMode(): ChatMode {
  const mode = import.meta.env.VITE_CHAT_MODE?.trim()
  if (mode === 'api') return 'api'
  if (mode === 'arn') return 'arn'
  return 'mock'
}

/**
 * API 모드: Lambda Function URL / API Gateway 엔드포인트 직접 호출
 */
async function sendViaApi(data: ChatRequest): Promise<ChatResponse> {
  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl) {
    throw new Error('VITE_API_URL이 설정되지 않았습니다. .env 파일을 확인하세요.')
  }
  const response = await axios.post<ChatResponse>(apiUrl, data, {
    headers: { 'Content-Type': 'application/json' },
  })
  return response.data
}

/**
 * ARN 모드: Vite dev server 프록시를 통해 Lambda ARN 직접 호출
 * POST /api/chat → vite.config.ts 미들웨어 → AWS SDK Lambda Invoke
 */
async function sendViaArn(data: ChatRequest): Promise<ChatResponse> {
  const response = await axios.post<ChatResponse>('/api/chat', data, {
    headers: { 'Content-Type': 'application/json' },
  })
  return response.data
}

/**
 * Mock 모드: API 연결 없이 목업 응답 반환
 */
async function sendViaMock(data: ChatRequest): Promise<ChatResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  return { reply: getMockResponse(data.message) }
}

export const chatApi = {
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const mode = getChatMode()

    switch (mode) {
      case 'api':
        return sendViaApi(data)
      case 'arn':
        return sendViaArn(data)
      default:
        return sendViaMock(data)
    }
  },

  /** 현재 설정된 채팅 모드 반환 */
  getMode: getChatMode,
}

// =============================================================================
// Mock 응답 데이터
// =============================================================================

function getMockResponse(message: string): string {
  const lower = message.toLowerCase()

  // 다이어그램 관련 키워드 감지 (차트보다 먼저 체크 — "플로우차트"에 "차트"가 포함되므로)
  if (lower.includes('다이어그램') || lower.includes('플로우') || lower.includes('mermaid') || lower.includes('흐름')) {
    return `Mermaid 다이어그램 예시를 보여드리겠습니다!\n\n### 플로우차트\n\n\`\`\`mermaid\nflowchart TD\n    A[사용자 입력] --> B{유효성 검사}\n    B -->|통과| C[API 호출]\n    B -->|실패| D[에러 표시]\n    C --> E{응답 확인}\n    E -->|성공| F[결과 렌더링]\n    E -->|실패| G[재시도]\n    G --> C\n\`\`\`\n\n### 시퀀스 다이어그램\n\n\`\`\`mermaid\nsequenceDiagram\n    participant U as 사용자\n    participant F as Frontend\n    participant L as Lambda\n    participant AI as AI Model\n    U->>F: 메시지 입력\n    F->>L: POST /chat\n    L->>AI: 프롬프트 전달\n    AI-->>L: AI 응답\n    L-->>F: JSON 응답\n    F-->>U: 메시지 렌더링\n\`\`\``
  }

  // 선택 테이블 관련 키워드 감지
  if (lower.includes('피벗') || lower.includes('선택') || lower.includes('테이블') || lower.includes('pivot')) {
    return `피벗 테이블을 구성하겠습니다. 아래에서 필요한 항목을 선택해주세요.\n\n### 1단계: 분석 대상 컬럼 선택 (복수 선택 가능)\n\n\`\`\`selectable-table\n${JSON.stringify({
      type: 'checkbox',
      title: '분석 대상 컬럼',
      description: '피벗 테이블에 포함할 컬럼을 선택하세요. 여러 개를 선택할 수 있습니다.',
      columns: ['컬럼명', '데이터 타입', '샘플 데이터', '설명'],
      rows: [
        { id: 'col1', values: ['사원번호', 'VARCHAR', 'EMP001', '사원 고유 식별번호'] },
        { id: 'col2', values: ['사원명', 'VARCHAR', '홍길동', '사원 이름'] },
        { id: 'col3', values: ['부서', 'VARCHAR', '개발팀', '소속 부서'] },
        { id: 'col4', values: ['직급', 'VARCHAR', '과장', '직급 정보'] },
        { id: 'col5', values: ['입사일', 'DATE', '2020-03-15', '입사 날짜'] },
        { id: 'col6', values: ['급여', 'NUMBER', '5,200,000', '월 급여(원)'] },
        { id: 'col7', values: ['성과등급', 'VARCHAR', 'A', '연간 성과 평가 등급'] },
      ],
      confirmText: '컬럼 선택 완료',
    })}\n\`\`\`\n\n### 2단계: 집계 방식 선택 (하나만 선택)\n\n\`\`\`selectable-table\n${JSON.stringify({
      type: 'radio',
      title: '집계 방식',
      description: '피벗 테이블에 적용할 집계 함수를 하나 선택하세요.',
      columns: ['집계 함수', '설명', '적용 예시'],
      rows: [
        { id: 'agg1', values: ['SUM', '합계를 구합니다', '급여 합계: 52,000,000'] },
        { id: 'agg2', values: ['AVG', '평균을 구합니다', '평균 급여: 5,200,000'] },
        { id: 'agg3', values: ['COUNT', '개수를 셉니다', '인원 수: 10'] },
        { id: 'agg4', values: ['MAX', '최대값을 구합니다', '최고 급여: 8,500,000'] },
        { id: 'agg5', values: ['MIN', '최소값을 구합니다', '최저 급여: 3,200,000'] },
      ],
      confirmText: '집계 방식 선택',
    })}\n\`\`\``
  }

  // 차트 관련 키워드 감지
  if (lower.includes('차트') || lower.includes('그래프') || lower.includes('chart')) {
    return `차트 예시를 보여드리겠습니다!\n\n### Bar Chart (매출 데이터)\n\n\`\`\`chart\n${JSON.stringify({
      type: 'bar',
      title: '2025년 분기별 매출',
      data: [
        { quarter: 'Q1', 매출: 4200, 비용: 2400 },
        { quarter: 'Q2', 매출: 5800, 비용: 2800 },
        { quarter: 'Q3', 매출: 7200, 비용: 3200 },
        { quarter: 'Q4', 매출: 9100, 비용: 3600 },
      ],
    })}\n\`\`\`\n\n### Line Chart (트래픽 추이)\n\n\`\`\`chart\n${JSON.stringify({
      type: 'line',
      title: '월별 방문자 수',
      data: [
        { month: '1월', 방문자: 1200, 페이지뷰: 3400 },
        { month: '2월', 방문자: 1900, 페이지뷰: 4800 },
        { month: '3월', 방문자: 2400, 페이지뷰: 6200 },
        { month: '4월', 방문자: 3100, 페이지뷰: 7800 },
        { month: '5월', 방문자: 4200, 페이지뷰: 9500 },
        { month: '6월', 방문자: 3800, 페이지뷰: 8900 },
      ],
    })}\n\`\`\`\n\n### Pie Chart (비율)\n\n\`\`\`chart\n${JSON.stringify({
      type: 'pie',
      title: '기술 스택 사용 비율',
      data: [
        { name: 'React', value: 42 },
        { name: 'Vue', value: 28 },
        { name: 'Angular', value: 15 },
        { name: 'Svelte', value: 10 },
        { name: 'Others', value: 5 },
      ],
    })}\n\`\`\``
  }

  const responses = [
    `"${message}"에 대한 답변입니다.\n\n이것은 **Mock 응답**입니다. Lambda API가 연결되면 실제 AI 응답으로 대체됩니다.\n\n### 예시 마크다운\n- 리스트 아이템 1\n- 리스트 아이템 2\n- 리스트 아이템 3\n\n\`\`\`typescript\nconst hello = "world";\nconsole.log(hello);\n\`\`\``,
    `질문을 잘 받았습니다!\n\n> ${message}\n\n현재 **Mock 모드**로 동작 중입니다. \`.env\` 파일에 \`VITE_CHAT_MODE\`를 설정하면 실제 Lambda API와 연결됩니다.`,
    `안녕하세요! 다음은 테스트 응답입니다.\n\n1. 첫 번째 항목\n2. 두 번째 항목\n3. 세 번째 항목\n\n---\n\n\`인라인 코드\` 와 **볼드**, *이탤릭*도 지원합니다.`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]!
}
