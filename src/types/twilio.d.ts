declare module 'twilio' {
  export interface Twilio {
    messages: {
      create(params: any): Promise<any>;
    };
  }
  
  export function twilio(accountSid: string, authToken: string): Twilio;
  
  export default twilio;
}