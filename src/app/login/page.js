import React from 'react';
import LoginForm from './login-form';

export const metadata = {
  title: 'Sign In | IMP3RIAL EDU',
  description: 'Sign in to your IMP3RIAL EDU school portal to manage grading, attendance, CBT exams, and tuition.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Sign In | IMP3RIAL EDU',
    description: 'Sign in to your IMP3RIAL EDU school portal.',
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
