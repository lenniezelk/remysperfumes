import { Client, SendEmailV3_1, LibraryResponse } from 'node-mailjet';
import { env } from "cloudflare:workers";

export const sendPasswordEmail = async (password: string, receiver: string) => {
    if (import.meta.env.DEV) {
        console.log(`Receiver: ${receiver}, Password: ${password}`);
        return {
            status: 'SUCCESS',
            data: null,
        }
    }

    const mailjet = new Client({
        apiKey: env.MAILJET_API_KEY,
        apiSecret: env.MAILJET_SECRET_KEY,
    });

    const data: SendEmailV3_1.Body = {
        Messages: [
            {
                From: {
                    Email: env.NOREPLY_SENDER_ADDRESS,
                },
                To: [
                    {
                        Email: receiver,
                    }
                ],
                TemplateID: Number(env.PASSWORD_EMAIL_TEMPLATE_ID),
                TemplateLanguage: true,
                Variables: {
                    password,
                }
            }
        ]
    }

    const result: LibraryResponse<SendEmailV3_1.Response> = await mailjet.post(
        'send',
        { version: 'v3.1' },
    ).request(data);

    const message = result.body.Messages[0];

    if (message.Status === SendEmailV3_1.ResponseStatus.Success) {
        return {
            status: 'SUCCESS',
            data: null,
        }
    } else {
        return {
            status: 'ERROR',
            error: mailJetErrorsToString(message.Errors),
        }
    }
}

export const mailJetErrorsToString = (errors: Array<SendEmailV3_1.ResponseError>): string => {
    return errors.map(error => error.ErrorMessage).join(', ');
}