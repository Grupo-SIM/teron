import { getDictionary, type Locale } from "@/i18n/site";

export type AuthConfig = {
  accountsUrl: string;
  disableSignup: boolean;
  hideLocalLogin: boolean;
  useOtp: boolean;
};

export type LoginInfo = {
  account: string;
  name?: string;
  token?: string;
  tfaRequired?: boolean;
};

export type WorkspaceInfo = {
  uuid: string;
  url: string;
  name?: string;
  lastVisit?: number;
  mode?: string;
  status?: { lastVisit?: number; mode?: string };
};

export type WorkspaceLoginInfo = LoginInfo & {
  workspace: string;
  workspaceUrl: string;
  endpoint: string;
  token: string;
};

export type LoginInfoRequest = {
  request: true;
  firstName?: string;
  lastName?: string;
};

export type LoginInfoByToken = LoginInfo | WorkspaceLoginInfo | LoginInfoRequest | null;

export type OtpInfo = { sent: boolean; retryOn: number };
export type RegionInfo = { region: string; name: string };
export type ProviderInfo = { name: string; displayName?: string };
export type InviteInfo = { workspaceName: string | null; email?: string; accountExists?: boolean };
export type WorkspaceInviteInfo = { workspace: string; email?: string; name?: string };

type RpcResponse<T> = { result?: T; error?: { code?: string; message?: string; params?: Record<string, unknown> } };

export class AuthApiError extends Error {
  constructor(readonly code: string, message?: string) {
    super(message ?? code);
  }
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function loadAuthConfig(locale: Locale): Promise<AuthConfig> {
  const errors = getDictionary(locale).authErrors;
  const response = await fetch("/config.json", { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) throw new Error(errors.configUnavailable);
  const config = (await response.json()) as Record<string, string | undefined>;
  if (!config.ACCOUNTS_URL) throw new Error(errors.accountServiceMissing);

  return {
    accountsUrl: config.ACCOUNTS_URL,
    disableSignup: config.DISABLE_SIGNUP === "true",
    hideLocalLogin: config.HIDE_LOCAL_LOGIN === "true",
    useOtp: Boolean(config.MAIL_URL),
  };
}

export class AuthApi {
  constructor(readonly config: AuthConfig, readonly locale: Locale) {}

  private async rpc<T>(method: string, params: Record<string, unknown>, token?: string): Promise<T> {
    const response = await fetch(this.config.accountsUrl, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ method, params }),
    });
    const payload = (await response.json()) as RpcResponse<T>;
    if (payload.error) {
      throw new AuthApiError(payload.error.code ?? "unknown", payload.error.message);
    }
    return payload.result as T;
  }

  login(email: string, password: string) {
    return this.rpc<LoginInfo>("login", { email, password });
  }

  loginOtp(email: string) {
    return this.rpc<OtpInfo>("loginOtp", { email });
  }

  signUp(email: string, password: string, firstName: string, lastName: string) {
    return this.rpc<LoginInfo>("signUp", { email, password, firstName, lastName });
  }

  signUpOtp(email: string, firstName: string, lastName: string) {
    return this.rpc<OtpInfo>("signUpOtp", { email, firstName, lastName });
  }

  validateOtp(email: string, code: string, password?: string) {
    return this.rpc<LoginInfo>("validateOtp", { email, code, password });
  }

  verify2fa(code: string, token: string) {
    return this.rpc<LoginInfo>("verify2fa", { code }, token);
  }

  getLoginInfo(token?: string, data?: { firstName?: string; lastName?: string }) {
    return this.rpc<LoginInfoByToken>("getLoginInfoByToken", data ?? {}, token);
  }

  requestPasswordReset(email: string) {
    return this.rpc<void>("requestPasswordReset", { email });
  }

  restorePassword(password: string, token: string) {
    return this.rpc<LoginInfo>("restorePassword", { password }, token);
  }

  changePassword(oldPassword: string, newPassword: string, token?: string) {
    return this.rpc<void>("changePassword", { oldPassword, newPassword }, token);
  }

  confirm(token: string) {
    return this.rpc<LoginInfo>("confirm", {}, token);
  }

  getWorkspaces(token?: string) {
    return this.rpc<WorkspaceInfo[]>("getUserWorkspaces", {}, token).then((workspaces) =>
      workspaces.map((workspace) => ({ ...workspace, ...workspace.status })),
    );
  }

  selectWorkspace(workspaceUrl: string, token?: string) {
    return this.rpc<WorkspaceLoginInfo>(
      "selectWorkspace",
      { workspaceUrl, kind: "external", externalRegions: [] },
      token,
    );
  }

  getRegions(token?: string) {
    return this.rpc<RegionInfo[]>("getRegionInfo", {}, token);
  }

  getWorkspaceCreationInfo(token?: string) {
    return this.rpc<{ freeTrialAvailable: boolean }>("getWorkspaceCreationInfo", {}, token);
  }

  createWorkspace(
    workspaceName: string,
    region: string,
    withDemoContent: boolean,
    payment: {
      seats: number; customerDocument: string; customerPhone: string;
      card: { number: string; expMonth: string; expYear: string; cvv: string; holderName: string; holderDocument: string };
    } | undefined,
    token?: string,
  ) {
    return this.rpc<WorkspaceLoginInfo>(
      "createWorkspace",
      { workspaceName, region, configuration: { withDemoContent }, payment },
      token,
    );
  }

  performWorkspaceOperation(workspaceId: string, event: "unarchive", token: string) {
    return this.rpc<boolean>("performWorkspaceOperation", { workspaceId, event, params: [] }, token);
  }

  async getProviders(): Promise<ProviderInfo[]> {
    const response = await fetch(joinUrl(this.config.accountsUrl, "/providers"), { credentials: "include" });
    if (!response.ok) return [];
    return (await response.json()) as ProviderInfo[];
  }

  getInviteInfo(inviteId: string) {
    return this.rpc<InviteInfo>("getInviteInfo", { inviteId });
  }

  checkJoin(inviteId: string, token?: string) {
    return this.rpc<WorkspaceLoginInfo>("checkJoin", { inviteId }, token);
  }

  checkAutoJoin(inviteId: string, firstName: string, lastName: string, token?: string) {
    return this.rpc<WorkspaceLoginInfo | WorkspaceInviteInfo>(
      "checkAutoJoin",
      { inviteId, firstName, lastName },
      token,
    );
  }

  joinByToken(inviteId: string, token?: string) {
    return this.rpc<WorkspaceLoginInfo>("joinByToken", { inviteId }, token);
  }

  join(email: string, password: string, inviteId: string, workspaceUrl: string) {
    return this.rpc<WorkspaceLoginInfo | LoginInfo>("join", { email, password, inviteId, workspaceUrl });
  }

  signUpJoin(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    inviteId: string,
    workspaceUrl: string,
  ) {
    return this.rpc<WorkspaceLoginInfo | LoginInfo>("signUpJoin", {
      email,
      password,
      first: firstName,
      last: lastName,
      inviteId,
      workspaceUrl,
    });
  }

  async setCookie(token: string): Promise<void> {
    if (!token || token === "undefined" || token === "null") {
      throw new Error(getDictionary(this.locale).authErrors.sessionStartFailed);
    }
    const response = await fetch(joinUrl(this.config.accountsUrl, "/cookie"), {
      method: "PUT",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(getDictionary(this.locale).authErrors.sessionStartFailed);
  }

  async deleteCookie(): Promise<void> {
    const response = await fetch(joinUrl(this.config.accountsUrl, "/cookie"), {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error(getDictionary(this.locale).authErrors.sessionEndFailed);
  }

  providerUrl(provider: string, query?: { inviteId?: string; autoJoin?: boolean; navigateUrl?: string }): string {
    const url = new URL(joinUrl(this.config.accountsUrl, `/auth/${provider}`), window.location.origin);
    if (query?.inviteId) url.searchParams.set("inviteId", query.inviteId);
    if (query?.autoJoin) url.searchParams.set("autoJoin", "");
    if (query?.navigateUrl) url.searchParams.set("navigateUrl", query.navigateUrl);
    return url.toString();
  }
}

export function authErrorMessage(error: unknown, locale: Locale): string {
  const code = error instanceof AuthApiError ? (error.code.split(":").at(-1) ?? "") : "";
  const messages = getDictionary(locale).authErrors;
  const match = code in messages ? messages[code as keyof typeof messages] : undefined;
  if (match) return match;
  if (error instanceof AuthApiError) return messages.unknown;
  if (error instanceof Error && error.message) return error.message;
  return messages.unknown;
}
