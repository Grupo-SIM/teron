"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";

import { usePillGlow } from "@/components/site/use-pill-glow";
import { getDictionary, type Locale, type SiteDictionary } from "@/i18n/site";

import {
  AuthApi,
  AuthApiError,
  authErrorMessage,
  loadAuthConfig,
  type LoginInfo,
  type ProviderInfo,
  type RegionInfo,
  type WorkspaceInfo,
  type WorkspaceLoginInfo,
} from "./auth-api";

type Variant = "login" | "signup";
type Step =
  | "credentials"
  | "otp"
  | "tfa"
  | "profile"
  | "recover"
  | "recovery-sent"
  | "restore"
  | "change-password"
  | "confirming"
  | "confirmation-sent"
  | "workspaces"
  | "restore-workspace"
  | "create-workspace"
  | "join";

function workspaceSeatPriceInCents(value: string): number {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return 999;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

// Next.js substitutes this direct public environment reference during the build.
const WORKSPACE_SEAT_PRICE_IN_CENTS = workspaceSeatPriceInCents(process.env.NEXT_PUBLIC_WORKSPACE_SEAT_AMOUNT ?? "9.99");

export function AuthFlow({ variant, locale }: { variant: Variant; locale: Locale }) {
  const dictionary = getDictionary(locale);
  const copy = dictionary.auth;
  const initialized = useRef(false);
  const autoJoin = useRef<{ inviteId: string; firstName: string; lastName: string } | undefined>(undefined);
  const navigateUrl = useRef<string | undefined>(undefined);
  const [api, setApi] = useState<AuthApi>();
  const [step, setStep] = useState<Step>("credentials");
  // A configuração chega depois da primeira pintura. Senha é o modo padrão;
  // assim o formulário não aparece incompleto enquanto `/config.json` carrega.
  const [passwordMode, setPasswordMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string>();
  const [otpRetryOn, setOtpRetryOn] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [archivedWorkspace, setArchivedWorkspace] = useState<{ workspace: WorkspaceInfo; login: WorkspaceLoginInfo }>();
  const [regions, setRegions] = useState<RegionInfo[]>([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [freeTrialAvailable, setFreeTrialAvailable] = useState<boolean>();
  const [seats, setSeats] = useState("1");
  const [customerDocument, setCustomerDocument] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [withDemoContent, setWithDemoContent] = useState(true);
  const [region, setRegion] = useState("");
  const [inviteId, setInviteId] = useState("");
  const [joinWorkspaceUrl, setJoinWorkspaceUrl] = useState("");
  const [inviteWorkspace, setInviteWorkspace] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [joinSignup, setJoinSignup] = useState(false);
  const [hasCurrentAccount, setHasCurrentAccount] = useState(false);

  useEffect(() => {
    void loadAuthConfig(locale)
      .then((config) => {
        if (variant === "signup" && config.disableSignup) {
          window.location.assign(locale === "en-US" ? "/en-US/entrar" : "/entrar");
          return;
        }
        const client = new AuthApi(config, locale);
        setApi(client);
        setPasswordMode(!config.useOtp);
        void client.getProviders().then(setProviders).catch(() => setProviders([]));
      })
      .catch((cause) => {
        setError(authErrorMessage(cause, locale));
        setLoading(false);
      });
  }, [locale, variant]);

  useEffect(() => {
    if (step !== "otp" || otpRetryOn <= Date.now()) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [otpRetryOn, step]);

  useEffect(() => {
    if (!api || initialized.current) return;
    initialized.current = true;
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") ?? "");
    const mode = params.get("mode");
    const queryToken = params.get("token") ?? undefined;
    navigateUrl.current = params.get("navigateUrl") ?? undefined;

    async function initialize() {
      try {
        if (params.get("provider")) {
          window.location.assign(api!.providerUrl(params.get("provider")!, {
            inviteId: params.get("inviteId") ?? undefined,
            autoJoin: params.has("autoJoin"),
            navigateUrl: navigateUrl.current,
          }));
        } else if (mode === "auth" && queryToken) {
          const info = await api!.getLoginInfo(queryToken);
          setToken(queryToken);
          await handleTokenInfo(info);
        } else if (mode === "confirm" && params.get("id")) {
          setStep("confirming");
          await completeAuthentication(await api!.confirm(params.get("id")!));
        } else if (mode === "restore" && params.get("id")) {
          setToken(params.get("id")!);
          setStep("restore");
        } else if (mode === "tfa" && queryToken) {
          setToken(queryToken);
          setStep("tfa");
        } else if (mode === "recover") {
          setStep("recover");
        } else if (mode === "confirmation-sent") {
          setStep("confirmation-sent");
        } else if (mode === "create-workspace") {
          const info = await api!.getLoginInfo();
          const authToken = info && "token" in info ? info.token : undefined;
          if (authToken) setToken(authToken);
          await loadWorkspaceCreationData(authToken);
          setStep("create-workspace");
        } else if (mode === "change-password") {
          setStep("change-password");
        } else if (mode === "join" && (params.get("inviteId") || params.get("workspace"))) {
          if (params.has("autoJoin") && params.get("inviteId")) {
            const request = {
              inviteId: params.get("inviteId")!,
              firstName: params.get("firstName") ?? "",
              lastName: params.get("lastName") ?? "",
            };
            autoJoin.current = request;
            const result = await api!.checkAutoJoin(request.inviteId, request.firstName, request.lastName, queryToken);
            if ("workspaceUrl" in result) await finishWorkspace(result);
            else {
              setEmail(result.email ?? "");
              setFirstName(result.name ?? request.firstName);
              setStep("credentials");
            }
          } else if (params.get("inviteId")) {
            await initializeInvite(params.get("inviteId")!);
          } else {
            const workspaceUrl = params.get("workspace")!;
            setJoinWorkspaceUrl(workspaceUrl);
            setInviteWorkspace(workspaceUrl);
            setStep("join");
          }
        } else if (mode === "workspaces") {
          const info = await api!.getLoginInfo();
          const authToken = info && "token" in info ? info.token : undefined;
          if (authToken) setToken(authToken);
          await loadWorkspaces(authToken);
        } else if (!mode) {
          const info = await api!.getLoginInfo().catch((cause: unknown) => {
            if (cause instanceof AuthApiError && cause.code.split(":").at(-1) === "Unauthorized") return null;
            throw cause;
          });
          if (info && !("request" in info)) {
            const query = new URLSearchParams(params);
            query.set("mode", "workspaces");
            window.location.replace(`${locale === "en-US" ? "/en-US" : ""}/entrar?${query.toString()}`);
          }
        }
      } catch (cause) {
        setError(authErrorMessage(cause, locale));
      } finally {
        setLoading(false);
      }
    }

    void initialize();
    // The initializer must run once for each API instance; rerunning it would replay token actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, locale]);

  async function run(action: () => Promise<void>) {
    setLoading(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(authErrorMessage(cause, locale));
    } finally {
      setLoading(false);
    }
  }

  async function completeAuthentication(info: LoginInfo) {
    if (!api) return;
    if (info.tfaRequired && info.token) {
      setToken(info.token);
      setStep("tfa");
      return;
    }
    if (!info.token) {
      setStep("confirmation-sent");
      return;
    }
    await api.setCookie(info.token);
    setToken(info.token);
    if (autoJoin.current) {
      const request = autoJoin.current;
      const result = await api.checkAutoJoin(request.inviteId, request.firstName, request.lastName, info.token);
      if ("workspaceUrl" in result) {
        await finishWorkspace(result);
        return;
      }
    }
    await loadWorkspaces(info.token);
  }

  async function handleTokenInfo(info: Awaited<ReturnType<AuthApi["getLoginInfo"]>>) {
    if (!info) {
      setStep("credentials");
      return;
    }
    if ("request" in info) {
      setFirstName(info.firstName ?? "");
      setLastName(info.lastName ?? "");
      setStep("profile");
      return;
    }
    if ("workspaceUrl" in info) {
      await finishWorkspace(info);
      return;
    }
    await completeAuthentication(info);
  }

  async function loadWorkspaces(authToken?: string) {
    if (!api) return;
    const result = await api.getWorkspaces(authToken);
    setWorkspaces(result.toSorted((a, b) => (b.lastVisit ?? 0) - (a.lastVisit ?? 0)));
    await loadWorkspaceCreationData(authToken);
    if (result.length === 0) {
      setStep("create-workspace");
    } else {
      setStep("workspaces");
    }
  }

  async function loadWorkspaceCreationData(authToken?: string) {
    if (!api) return;
    const [creationInfo, availableRegions] = await Promise.all([
      api.getWorkspaceCreationInfo(authToken),
      api.getRegions(authToken),
    ]);
    setFreeTrialAvailable(creationInfo.freeTrialAvailable);
    setRegions(availableRegions.filter((item) => item.name));
    setRegion(availableRegions.find((item) => item.name)?.region ?? "");
  }

  async function finishWorkspace(result: WorkspaceLoginInfo | LoginInfo) {
    if (!api) return;
    if (!result.token) {
      setStep("confirmation-sent");
      return;
    }
    if (!("workspaceUrl" in result)) {
      await completeAuthentication(result);
      return;
    }
    await api.setCookie(result.token);
    let destination = `/workbench/${encodeURIComponent(result.workspaceUrl)}`;
    if (navigateUrl.current) {
      try {
        const location = JSON.parse(decodeURIComponent(navigateUrl.current)) as { path?: string[] };
        if (location.path?.[1] === result.workspaceUrl) {
          destination = `/${location.path.map(encodeURIComponent).join("/")}`;
        }
      } catch {
        // Ignore malformed legacy destinations and open the selected workspace normally.
      }
    }
    // `/workbench` belongs to the platform SPA, outside this static Next application.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(destination);
  }

  async function selectWorkspace(workspace: WorkspaceInfo) {
    if (!api) return;
    const result = await api.selectWorkspace(workspace.url, token);
    if (workspace.mode === "archived" || workspace.mode?.startsWith("archiving-")) {
      setArchivedWorkspace({ workspace, login: result });
      setStep("restore-workspace");
      return;
    }
    await finishWorkspace(result);
  }

  async function changeAccount() {
    if (!api) return;
    setLoading(true);
    setError("");
    try {
      await api.deleteCookie();
      window.location.replace(locale === "en-US" ? "/en-US/entrar" : "/entrar");
    } catch (cause) {
      setError(authErrorMessage(cause, locale));
      setLoading(false);
    }
  }

  async function restoreWorkspace() {
    if (!api || !archivedWorkspace) return;
    await run(async () => {
      await api.performWorkspaceOperation(archivedWorkspace.workspace.uuid, "unarchive", archivedWorkspace.login.token);
      setToken(archivedWorkspace.login.token);
      setArchivedWorkspace(undefined);
      await loadWorkspaces(archivedWorkspace.login.token);
    });
  }

  async function initializeInvite(id: string) {
    if (!api) return;
    setInviteId(id);
    setStep("join");
    const [invite, account] = await Promise.all([
      api.getInviteInfo(id),
      api.getLoginInfo().catch((cause: unknown) => {
        if (cause instanceof AuthApiError && cause.code.split(":").at(-1) === "Unauthorized") return null;
        throw cause;
      }),
    ]);
    const accountToken = account && "token" in account ? account.token : undefined;
    setInviteWorkspace(invite.workspaceName ?? "");
    setInviteEmail(invite.email ?? "");
    if (invite.email) setEmail(invite.email);
    setJoinSignup(invite.accountExists === false);
    setToken(accountToken);
    setHasCurrentAccount(accountToken !== undefined);
    try {
      await finishWorkspace(await api.checkJoin(id, accountToken));
    } catch (cause) {
      // These responses are expected when the invite still needs authentication or acceptance.
      if (!(cause instanceof AuthApiError) || !["Unauthorized", "Forbidden"].includes(cause.code.split(":").at(-1) ?? "")) {
        throw cause;
      }
    }
  }

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!api) return;
    await run(async () => {
      if (!email || (variant === "signup" && (!firstName || !lastName))) throw new Error(copy.requiredFields);
      if (passwordMode && (!password || (variant === "signup" && password !== password2))) {
        setError(password !== password2 ? copy.passwordsMismatch : copy.requiredFields);
        return;
      }
      if (variant === "login") {
        if (passwordMode) await completeAuthentication(await api.login(email, password));
        else {
          const otp = await api.loginOtp(email);
          setOtpRetryOn(otp.retryOn);
          setStep("otp");
        }
      } else if (api.config.useOtp) {
        const otp = await api.signUpOtp(email, firstName, lastName);
        setOtpRetryOn(otp.retryOn);
        setStep("otp");
      } else {
        await completeAuthentication(await api.signUp(email, password, firstName, lastName));
      }
    });
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!api || code.length !== 6) return;
    await run(async () => completeAuthentication(await api.validateOtp(email, code, password || undefined)));
  }

  async function submitTfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!api || !token || code.length !== 6) return;
    await run(async () => completeAuthentication(await api.verify2fa(code, token)));
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!api || !token || !firstName) return;
    await run(async () => handleTokenInfo(await api.getLoginInfo(token, { firstName, lastName })));
  }

  async function submitRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!api || !email) return;
    await run(async () => {
      await api.requestPasswordReset(email);
      setStep("recovery-sent");
    });
  }

  async function submitRestore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!api || !token) return;
    if (!password || password !== password2) {
      setError(copy.passwordsMismatch);
      return;
    }
    await run(async () => completeAuthentication(await api.restorePassword(password, token)));
  }

  async function submitPasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!api) return;
    if (!currentPassword || !password || password !== password2) {
      setError(password !== password2 ? copy.passwordsMismatch : copy.requiredFields);
      return;
    }
    await run(async () => {
      await api.changePassword(currentPassword, password, token);
      await loadWorkspaces(token);
    });
  }

  async function submitWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!api || !workspaceName) return;
    await run(async () => {
      const [expMonth, expYear] = cardExpiry.split("/").map((value) => value.trim());
      const payment = freeTrialAvailable ? undefined : {
        seats: Number(seats), customerDocument: digitsOnly(customerDocument), customerPhone: digitsOnly(customerPhone),
        card: { number: digitsOnly(cardNumber), expMonth, expYear, cvv: cardCvv, holderName: cardHolder, holderDocument: digitsOnly(customerDocument) },
      };
      await finishWorkspace(await api.createWorkspace(workspaceName, region, withDemoContent, payment, token));
    });
  }

  async function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!api) return;
    await run(async () => {
      if (joinSignup && password !== password2) {
        setError(copy.passwordsMismatch);
        return;
      }
      const result = joinSignup
        ? await api.signUpJoin(email, password, firstName, lastName, inviteId, joinWorkspaceUrl)
        : await api.join(email, password, inviteId, joinWorkspaceUrl);
      await finishWorkspace(result);
    });
  }

  const title =
    step === "credentials"
      ? variant === "login"
        ? copy.loginTitle
        : copy.signupTitle
      : step === "otp"
        ? copy.codeTitle
        : step === "tfa"
          ? copy.tfaTitle
          : step === "profile"
            ? copy.profileTitle
          : step === "recover"
            ? copy.recoverTitle
            : step === "restore"
            ? copy.restoreTitle
            : step === "change-password"
              ? copy.changePasswordTitle
              : step === "workspaces"
                ? copy.workspacesTitle
                : step === "restore-workspace"
                  ? copy.restoreWorkspaceTitle
                : step === "create-workspace"
                  ? copy.createWorkspace
                  : step === "join"
                    ? copy.joinTitle
                    : step === "recovery-sent"
                      ? copy.recoverySent
                      : step === "confirmation-sent"
                        ? copy.confirmationSent
                        : copy.confirming;
  const seatsCount = Number(seats);
  const monthlyTotalInCents = Number.isSafeInteger(seatsCount) && seatsCount > 0
    ? seatsCount * WORKSPACE_SEAT_PRICE_IN_CENTS
    : undefined;
  const monthlyTotal = monthlyTotalInCents != null && Number.isSafeInteger(monthlyTotalInCents)
    ? new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(monthlyTotalInCents / 100)
    : undefined;

  return (
    <>
      <h1 className="auth-title">{title}</h1>
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      {step === "credentials" ? (
        <>
          {!api?.config.hideLocalLogin ? <form className="auth-form" onSubmit={submitCredentials}>
            {variant === "signup" ? (
              <div className="auth-fields-row">
                <AuthInput name="given-name" label={copy.firstName} value={firstName} onChange={setFirstName} autoComplete="given-name" />
                <AuthInput name="family-name" label={copy.lastName} value={lastName} onChange={setLastName} autoComplete="family-name" />
              </div>
            ) : null}
            <AuthInput name="email" label={copy.email} value={email} onChange={setEmail} type="email" autoComplete="email" placeholder={copy.emailPlaceholder} />
            {passwordMode ? (
              <>
                <AuthInput testId="auth-password" name={variant === "login" ? "current-password" : "new-password"} label={copy.password} value={password} onChange={setPassword} type="password" autoComplete={variant === "login" ? "current-password" : "new-password"} />
                {variant === "signup" ? <AuthInput testId="auth-password-repeat" name="new-password" label={copy.repeatPassword} value={password2} onChange={setPassword2} type="password" autoComplete="new-password" /> : null}
              </>
            ) : null}
            <AuthSubmit disabled={!email || (variant === "signup" && (!firstName || !lastName)) || (passwordMode && (!password || (variant === "signup" && !password2)))} loading={loading} label={variant === "login" ? copy.enter : copy.createAccount} />
          </form> : null}
          {!api?.config.hideLocalLogin ? <div className="auth-inline-actions">
            {api?.config.useOtp ? <button data-testid="auth-method-toggle" type="button" onClick={() => setPasswordMode((value) => !value)}>{passwordMode ? (variant === "login" ? copy.useCode : copy.useCodeSignup) : (variant === "login" ? copy.usePassword : copy.setPassword)}</button> : null}
            {variant === "login" ? <button data-testid="auth-recover" type="button" onClick={() => setStep("recover")}>{copy.forgotPassword}</button> : null}
          </div> : null}
          <Providers
            api={api}
            providers={providers}
            variant={variant}
            copy={copy}
            query={autoJoin.current ? { inviteId: autoJoin.current.inviteId, autoJoin: true, navigateUrl: navigateUrl.current } : undefined}
          />
        </>
      ) : null}

      {step === "otp" ? (
        <form className="auth-form" onSubmit={submitCode}>
          <p className="auth-description">{copy.codeDescription} <strong>{email}</strong>.</p>
          <AuthInput label={copy.code} value={code} onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" />
          <AuthSubmit disabled={code.length !== 6} loading={loading} label={copy.verify} />
          <div className="auth-inline-actions">
            <button type="button" onClick={() => { setCode(""); setStep("credentials"); }}>{copy.changeEmail}</button>
            <button type="button" disabled={loading || otpRetryOn > now} onClick={() => void run(async () => { const otp = variant === "signup" ? await api!.signUpOtp(email, firstName, lastName) : await api!.loginOtp(email); setOtpRetryOn(otp.retryOn); setNow(Date.now()); setCode(""); })}>{otpRetryOn > now ? `${copy.resend} (${Math.ceil((otpRetryOn - now) / 1000)}s)` : copy.resend}</button>
          </div>
        </form>
      ) : null}

      {step === "tfa" ? <SimpleCodeForm copy={copy} code={code} setCode={setCode} loading={loading} onSubmit={submitTfa} /> : null}
      {step === "profile" ? (
        <form className="auth-form" onSubmit={submitProfile}>
          <div className="auth-fields-row">
            <AuthInput name="given-name" label={copy.firstName} value={firstName} onChange={setFirstName} autoComplete="given-name" />
            <AuthInput name="family-name" label={copy.lastName} value={lastName} onChange={setLastName} autoComplete="family-name" required={false} />
          </div>
          <AuthSubmit disabled={!firstName} loading={loading} label={copy.continue} />
        </form>
      ) : null}
      {step === "recover" ? (
        <form className="auth-form" onSubmit={submitRecovery}>
          <AuthInput label={copy.email} value={email} onChange={setEmail} type="email" autoComplete="email" />
          <AuthSubmit disabled={!email} loading={loading} label={copy.recoverAction} />
          <BackButton label={copy.back} onClick={() => setStep("credentials")} />
        </form>
      ) : null}
      {step === "restore" ? (
        <form className="auth-form" onSubmit={submitRestore}>
          <AuthInput label={copy.password} value={password} onChange={setPassword} type="password" autoComplete="new-password" />
          <AuthInput label={copy.repeatPassword} value={password2} onChange={setPassword2} type="password" autoComplete="new-password" />
          <AuthSubmit disabled={!password || !password2} loading={loading} label={copy.restoreAction} />
        </form>
      ) : null}
      {step === "change-password" ? (
        <form className="auth-form" onSubmit={submitPasswordChange}>
          <AuthInput label={copy.currentPassword} value={currentPassword} onChange={setCurrentPassword} type="password" autoComplete="current-password" />
          <AuthInput label={copy.password} value={password} onChange={setPassword} type="password" autoComplete="new-password" />
          <AuthInput label={copy.repeatPassword} value={password2} onChange={setPassword2} type="password" autoComplete="new-password" />
          <AuthSubmit disabled={!currentPassword || !password || !password2} loading={loading} label={copy.changePasswordAction} />
        </form>
      ) : null}
      {step === "recovery-sent" || step === "confirmation-sent" ? (
        <div className="auth-message">
          <p>{step === "recovery-sent" ? copy.recoverySentBody : copy.confirmationSentBody}</p>
          <a href={locale === "en-US" ? "/en-US/entrar" : "/entrar"}>{copy.enter}</a>
        </div>
      ) : null}
      {step === "confirming" ? <p className="auth-status">{copy.loading}</p> : null}
      {step === "workspaces" ? (
        <div className="auth-workspaces">
          {workspaces.map((workspace) => <button data-testid="auth-workspace" key={workspace.uuid} type="button" disabled={loading} onClick={() => void run(async () => selectWorkspace(workspace))}><span>{workspace.name ?? workspace.url}</span><small>{workspace.url}{workspace.mode === "archived" || workspace.mode?.startsWith("archiving-") ? ` · ${dictionary.authPage.archived}` : ""}</small></button>)}
          <button data-testid="auth-create-workspace" className="auth-secondary" type="button" onClick={() => setStep("create-workspace")}>{copy.createWorkspace}</button>
          <button className="auth-back-action" type="button" disabled={loading} onClick={() => void changeAccount()}>{copy.changeAccount}</button>
        </div>
      ) : null}
      {step === "restore-workspace" ? (
        <div className="auth-message">
          <p>{copy.restoreWorkspaceBody}</p>
          <button className="auth-secondary" type="button" disabled={loading} onClick={() => void restoreWorkspace()}>{copy.restoreWorkspace}</button>
          <BackButton label={copy.back} onClick={() => setStep("workspaces")} />
        </div>
      ) : null}
      {step === "create-workspace" ? (
        <form className="auth-form" onSubmit={submitWorkspace}>
          <AuthInput testId="auth-workspace-name" label={copy.workspaceName} value={workspaceName} onChange={setWorkspaceName} autoComplete="organization" />
          {regions.length > 1 ? <label className="auth-label">{copy.region}<select className="auth-input auth-select" value={region} onChange={(event) => setRegion(event.target.value)}>{regions.map((item) => <option key={item.region} value={item.region}>{item.name}</option>)}</select></label> : null}
          {freeTrialAvailable ? <p className="auth-description">{copy.freeTrialDescription}</p> : <fieldset className="auth-billing"><legend>{copy.billingTitle}</legend><p>{copy.billingDescription}</p><AuthInput label={copy.seats} value={seats} onChange={(value) => setSeats(value.replace(/\D/g, ""))} inputMode="numeric" />{monthlyTotal ? <p className="auth-billing-total" aria-live="polite"><span>{copy.billingTotal}</span><strong>{monthlyTotal}</strong></p> : null}<AuthInput name="document" label={copy.document} value={customerDocument} onChange={(value) => setCustomerDocument(formatDocument(value))} placeholder={copy.documentPlaceholder} inputMode="numeric" /><AuthInput name="tel" label={copy.phone} value={customerPhone} onChange={(value) => setCustomerPhone(formatPhone(value))} placeholder={copy.phonePlaceholder} inputMode="numeric" autoComplete="tel" /><AuthInput name="cc-number" label={copy.cardNumber} value={cardNumber} onChange={(value) => setCardNumber(formatCardNumber(value))} placeholder={copy.cardNumberPlaceholder} inputMode="numeric" autoComplete="cc-number" /><div className="auth-fields-row"><AuthInput name="cc-exp" label={copy.cardExpiry} value={cardExpiry} onChange={(value) => setCardExpiry(formatCardExpiry(value))} placeholder={copy.cardExpiryPlaceholder} inputMode="numeric" autoComplete="cc-exp" /><AuthInput name="cc-csc" label={copy.cardCvv} value={cardCvv} onChange={(value) => setCardCvv(digitsOnly(value).slice(0, 4))} placeholder={copy.cardCvvPlaceholder} inputMode="numeric" autoComplete="cc-csc" /></div><AuthInput name="cc-name" label={copy.cardHolder} value={cardHolder} onChange={setCardHolder} autoComplete="cc-name" /></fieldset>}
          <label className="auth-check">
            <input className="auth-check-input" type="checkbox" checked={withDemoContent} onChange={(event) => setWithDemoContent(event.target.checked)} />
            <span className="auth-check-control" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="m2.25 6.25 2.3 2.3 5.2-5.2" /></svg></span>
            <span>{copy.demoContent}</span>
          </label>
          <AuthSubmit disabled={!workspaceName || (!freeTrialAvailable && (!Number.isInteger(Number(seats)) || Number(seats) < 1 || !isValidDocument(customerDocument) || !isValidPhone(customerPhone) || !isValidCardNumber(cardNumber) || !isValidCardExpiry(cardExpiry) || !/^\d{3,4}$/.test(cardCvv) || !cardHolder))} loading={loading} label={freeTrialAvailable ? copy.create : copy.paidCreate} />
          {workspaces.length ? <BackButton label={copy.back} onClick={() => setStep("workspaces")} /> : null}
        </form>
      ) : null}
      {step === "join" ? (
        <form className="auth-form" onSubmit={submitJoin}>
          {inviteWorkspace ? <p className="auth-description">{copy.joining} <strong>{inviteWorkspace}</strong>.</p> : null}
          {hasCurrentAccount ? <button data-testid="join-with-this-account" className="auth-secondary" type="button" onClick={() => void run(async () => finishWorkspace(await api!.joinByToken(inviteId, token)))}>{copy.joinCurrent}</button> : null}
          {joinSignup ? <div className="auth-fields-row"><AuthInput name="given-name" label={copy.firstName} value={firstName} onChange={setFirstName} autoComplete="given-name" /><AuthInput name="family-name" label={copy.lastName} value={lastName} onChange={setLastName} autoComplete="family-name" /></div> : null}
          <AuthInput name="email" label={copy.email} value={email} onChange={setEmail} type="email" autoComplete="email" placeholder={copy.emailPlaceholder} readOnly={Boolean(inviteEmail)} />
          <AuthInput testId="auth-password" label={copy.password} value={password} onChange={setPassword} type="password" autoComplete={joinSignup ? "new-password" : "current-password"} />
          {joinSignup ? <AuthInput testId="auth-password-repeat" label={copy.repeatPassword} value={password2} onChange={setPassword2} type="password" autoComplete="new-password" /> : null}
          <AuthSubmit testId="join-form-submit" disabled={!email || !password || (joinSignup && (!firstName || !lastName || !password2))} loading={loading} label={joinSignup ? copy.joinSignup : copy.joinLogin} />
          <BackButton testId="join-form-toggle" label={joinSignup ? copy.enter : copy.createAccount} onClick={() => setJoinSignup((value) => !value)} />
          <Providers api={api} providers={providers} variant={joinSignup ? "signup" : "login"} copy={copy} query={{ inviteId, navigateUrl: navigateUrl.current }} />
        </form>
      ) : null}
    </>
  );
}

type Copy = SiteDictionary["auth"];

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function formatDocument(value: string) {
  const digits = digitsOnly(value).slice(0, 14);
  if (digits.length <= 11) return digits.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2").replace(/(\d{3}\.\d{3}\.\d{3})(\d)/, "$1-$2");
  return digits.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2").replace(/(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2").replace(/(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  const prefixLength = digits.length === 11 ? 7 : 6;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, prefixLength)}-${digits.slice(prefixLength)}`;
}

function formatCardNumber(value: string) {
  return (digitsOnly(value).slice(0, 19).match(/.{1,4}/g) ?? []).join(" ");
}

function formatCardExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function isValidDocument(value: string) {
  return [11, 14].includes(digitsOnly(value).length);
}

function isValidPhone(value: string) {
  return [10, 11].includes(digitsOnly(value).length);
}

function isValidCardNumber(value: string) {
  const length = digitsOnly(value).length;
  return length >= 13 && length <= 19;
}

function isValidCardExpiry(value: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  return match !== null && Number(match[1]) >= 1 && Number(match[1]) <= 12;
}

function AuthInput({ label, value, onChange, type = "text", required = true, testId, ...props }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; testId?: string; name?: string; placeholder?: string; autoComplete?: string; inputMode?: "numeric"; readOnly?: boolean }) {
  return <label className="auth-label">{label}<span className="auth-input-row"><input data-testid={testId} className="auth-input" required={required} value={value} onChange={(event) => onChange(event.target.value)} type={type} {...props} /></span></label>;
}

function AuthSubmit({ label, loading, disabled = false, testId = "auth-submit" }: { label: string; loading: boolean; disabled?: boolean; testId?: string }) {
  const wrapRef = usePillGlow<HTMLDivElement>();
  return <div className="auth-submit-row"><div ref={wrapRef} className="auth-submit-wrap"><div className="auth-ring auth-ring--r"><div className="auth-ring-inner" /></div><div className="auth-ring auth-ring--l"><div className="auth-ring-inner" /></div><button type="submit" data-testid={testId} className="auth-submit" disabled={loading || disabled}><span aria-hidden className="auth-btn-glow"><span className="auth-btn-glow-core" /><span className="auth-btn-glow-wide" /></span><span className="auth-submit-label">{loading ? "…" : label}</span></button></div></div>;
}

function Providers({ api, providers, variant, copy, query }: { api?: AuthApi; providers: ProviderInfo[]; variant: Variant; copy: Copy; query?: { inviteId?: string; autoJoin?: boolean; navigateUrl?: string } }) {
  if (!providers.length) return null;
  const provider = (name: string) => { if (api) window.location.assign(api.providerUrl(name, query)); };
  const label = (item: ProviderInfo) => item.name === "google" ? (variant === "login" ? copy.googleLogin : copy.googleSignup) : item.name === "github" ? (variant === "login" ? copy.githubLogin : copy.githubSignup) : `${copy.continueWith} ${item.displayName ?? item.name}`;
  return <><div className="auth-or"><span className="auth-or-line auth-or-line--l" /><span className="auth-or-label">{copy.or}</span><span className="auth-or-line auth-or-line--r" /></div><div className="auth-providers">{providers.map((item) => <ProviderButton key={item.name} icon={item.name === "google" || item.name === "github" ? item.name : undefined} onClick={() => provider(item.name)}>{label(item)}</ProviderButton>)}</div></>;
}

function ProviderButton({ icon, onClick, children }: { icon?: string; onClick: () => void; children: ReactNode }) {
  return <button type="button" className="auth-provider" onClick={onClick}>{icon ? <Image src={`/assets/auth/${icon}.svg`} width={22} height={22} alt="" aria-hidden /> : null}<span>{children}</span></button>;
}

function BackButton({ label, onClick, testId }: { label: string; onClick: () => void; testId?: string }) {
  return <button data-testid={testId} className="auth-back-action" type="button" onClick={onClick}>{label}</button>;
}

function SimpleCodeForm({ copy, code, setCode, loading, onSubmit }: { copy: Copy; code: string; setCode: (value: string) => void; loading: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="auth-form" onSubmit={onSubmit}><AuthInput label={copy.code} value={code} onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" /><AuthSubmit disabled={code.length !== 6} loading={loading} label={copy.verify} /></form>;
}
