import ContainerNoOverflow from '@/components/ContainerNoOverflow';
import { getCurrentAdminUser, loginAdminUser } from '@/lib/auth/auth';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { type CredentialResponse, GoogleLogin } from '@react-oauth/google';
import * as jose from 'jose';

export const Route = createFileRoute('/admin/login')({
  component: RouteComponent,
  beforeLoad: async () => {
    const user = await getCurrentAdminUser();

    if (user.status === 'SUCCESS') {
      throw redirect({ to: '/admin' });
    }

    return {}
  }
})

function RouteComponent() {
  const navigate = useNavigate();

  const googleLogin = async (credentialResponse: CredentialResponse) => {
    const userInfo: { email: string; name: string; email_verified: boolean } = jose.decodeJwt(credentialResponse.credential as string);

    loginAdminUser({
      data: userInfo
    }).then((res) => {
      if (res.status === 'SUCCESS') {
        navigate({ to: '/admin', replace: true });
      }
    }).catch((err) => {
      console.error("Login error:", err);
    });
  }

  const googleLoginError = () => {
    console.error("Google Login Error");
  }

  return (
    <ContainerNoOverflow>
      <GoogleLogin onSuccess={googleLogin} onError={googleLoginError} shape='pill' auto_select />
    </ContainerNoOverflow>
  )
}
