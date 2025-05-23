
import { getAuditLogs } from "@/lib/data";
import { getSimulatedCurrentUser } from "@/lib/actions/auth";
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, AlertTriangle } from "lucide-react";
import { format } from 'date-fns';
import type { Metadata } from 'next';
import type { AuditLogEntry } from "@/types";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Audit Logs - MarketEase',
  description: 'View system audit logs.',
};

// Função para renderizar detalhes JSON de forma legível
const renderDetails = (details: any) => {
  if (!details) return <span className="text-muted-foreground">N/A</span>;
  if (typeof details === 'string') return details;
  try {
    // Tenta formatar como JSON, mas limita a profundidade para evitar sobrecarga
    const jsonString = JSON.stringify(details, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        // Limita o número de chaves para objetos grandes
        if (Object.keys(value).length > 5) {
          return '[Object too large to display fully]';
        }
      }
      return value;
    }, 2);
    
    if (jsonString.length > 300) { // Limita o comprimento total da string
        return <pre className="whitespace-pre-wrap text-xs bg-muted p-1 rounded-sm">{jsonString.substring(0, 300)}...</pre>;
    }
    return <pre className="whitespace-pre-wrap text-xs bg-muted p-1 rounded-sm">{jsonString}</pre>;
  } catch (e) {
    return <span className="text-destructive">Error displaying details</span>;
  }
};


export default async function AuditLogsPage() {
  const currentUser = await getSimulatedCurrentUser();

  if (currentUser?.role !== 'ADMIN') {
    // Redireciona para o dashboard se o usuário não for admin
    // Em um app real, isso seria melhor tratado por middleware
    console.warn(`User ${currentUser?.email} tried to access admin audit logs without ADMIN role.`);
    redirect('/app/dashboard'); 
  }

  const auditLogs = await getAuditLogs(100); // Pega os últimos 100 logs, por exemplo

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-2xl font-semibold text-foreground">Audit Logs</CardTitle>
            <CardDescription>Track important system events and user actions.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {auditLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>A list of recent audit log entries.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[150px]">Action</TableHead>
                  <TableHead className="w-[200px]">User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-[150px]">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log: AuditLogEntry) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                    <TableCell>
                      <Badge variant={log.action.includes("FAILED") || log.action.includes("EXCEPTION") ? "destructive" : "secondary"}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.userName || 'System/Unknown'}
                      {log.user?.email && <div className="text-xs text-muted-foreground">{log.user.email}</div>}
                    </TableCell>
                    <TableCell className="max-w-md">{renderDetails(log.details)}</TableCell>
                    <TableCell>{log.ipAddress || <span className="text-muted-foreground">N/A</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No audit logs found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Criar diretório se não existir
// mkdir -p src/app/app/admin/audit-logs
// touch src/app/app/admin/audit-logs/page.tsx
