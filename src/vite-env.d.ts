/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 채팅 모드: '' (mock) | 'api' | 'arn' */
  readonly VITE_CHAT_MODE: string
  /** API 모드: Lambda Function URL 또는 API Gateway 엔드포인트 */
  readonly VITE_API_URL: string
  /** ARN 모드: Lambda 함수 ARN */
  readonly VITE_LAMBDA_ARN: string
  /** ARN 모드: AWS 리전 */
  readonly VITE_AWS_REGION: string
  /** ARN 모드: AWS 프로필명 */
  readonly VITE_AWS_PROFILE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
