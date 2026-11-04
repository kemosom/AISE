export interface Lab04Issue {
  id: 'checkout' | 'queue' | 'security';
  title: string;
  file: string;
  type: string;
  report: string;
  source: string;
  sources?: Array<{ label: string; url: string; note: string }>;
}
