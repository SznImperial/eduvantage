import React from 'react';
import RegisterForm from './register-form';

export const metadata = {
  title: 'Register Your School | IMP3RIAL EDU',
  description: 'Register your school on IMP3RIAL EDU and set up your admin portal in minutes.',
  alternates: {
    canonical: '/register',
  },
  openGraph: {
    title: 'Register Your School | IMP3RIAL EDU',
    description: "Set up your school's admin portal on IMP3RIAL EDU.",
  },
};

export default function RegisterPage() {
  // Redeploy trigger
  return <RegisterForm />;
}
