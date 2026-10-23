declare module 'html2pdf.js' {
  export interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean; letterRendering?: boolean };
    jsPDF?: { unit?: string; format?: string | number[]; orientation?: 'portrait' | 'landscape' | string };
    pagebreak?: { mode?: string | string[]; before?: string | string[]; after?: string | string[] };
  }

  export interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement | string): Html2PdfInstance;
    save(): Promise<void>;
    outputPdf(type?: string): Promise<any>;
    output(type?: string): Promise<any>;
  }

  function html2pdf(): Html2PdfInstance;
  function html2pdf(element: HTMLElement | string, options?: Html2PdfOptions): Promise<void>;

  export default html2pdf;
}
