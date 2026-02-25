/** 用户信息 */
export interface User {
  id: string;
  username: string;
  email: string;
}

// ==================== 知识库 ====================

/** 知识库：用户创建的文档集合，RAG 检索的数据来源 */
export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  /** ISO 8601 格式的创建时间 */
  createdAt: string;
}

/** 知识库中的单个文档 */
export interface Document {
  id: string;
  /** 原始文件名 */
  filename: string;
  /** 文档处理状态：待处理 | 处理中 | 完成 | 失败 */
  status: "pending" | "processing" | "done" | "failed";
  /** 文档被切分后的文本块数量 */
  chunkCount: number;
}

// ==================== 对话 ====================

/** 会话：一组对话消息的集合 */
export interface Conversation {
  id: string;
  /** 会话标题（通常由第一条消息自动生成） */
  title: string;
  /** 关联的知识库 ID，不传则为普通对话 */
  kbId?: string;
  /** ISO 8601 格式的创建时间 */
  createdAt: string;
}

/** 会话中的单条消息 */
export interface Message {
  id: string;
  /** 消息角色：用户 | AI 助手 | 工具调用结果 */
  role: "user" | "assistant" | "tool";
  content: string;
  /** ISO 8601 格式的创建时间 */
  createdAt: string;
  /** Agent 模式下该消息触发的工具调用列表 */
  toolCalls?: Array<Toolcall>;
}

// ==================== WebSocket 事件 ====================

/** 客户端发送消息时的请求体 */
export interface ChatSendPayload {
  message: string;
  conversationId: string;
  /** 指定使用的知识库，不传则为普通对话 */
  kbId?: string;
}

/** 流式输出事件：服务端每次推送一个 token 片段 */
export interface ChatTokenEvent {
  /** 本次推送的增量文本片段 */
  delta: string;
  /** 对应的消息 ID，用于前端拼接完整消息 */
  msgId: string;
}

/** Agent 工具调用事件：Agent 每执行一步工具时推送 */
export interface AgentToolEvent {
  /** 工具名称，如 "search_knowledge_base" */
  tool: string;
  /** 传入工具的参数 */
  args: Record<string, unknown>;
  /** 工具执行返回的结果 */
  result: string;
  /** 当前是第几步推理步骤（从 1 开始） */
  step: number;
}

/** 流式输出结束事件：整条消息生成完毕时推送 */
export interface ChatDoneEvent {
  /** 已完成的消息 ID */
  msgId: string;
  /** 本次对话消耗的总 token 数 */
  totalTokens: number;
}

/** Agent 单次工具调用记录，持久化到 Message.toolCalls 中 */
export type Toolcall = {
  /** 工具名称 */
  name: string;
  /** 调用时传入的参数 */
  args: Record<string, unknown>;
  /** 工具返回的结果 */
  result: string;
};
