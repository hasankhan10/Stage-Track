import { Resend } from 'resend';

const resendSecret = process.env.RESEND_API_KEY;

if (!resendSecret) {
    console.warn('RESEND_API_KEY is not set in environment variables.');
}

export const resend = new Resend(resendSecret);
