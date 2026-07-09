import {
  IconCreditCard,
  IconCloudUpload,
  IconPalette,
  IconTicket,
  IconUserCircle,
} from "@tabler/icons-react";
import { type ComponentType, type ReactNode } from "react";

import { AdminLayout } from "~/components/admin/admin-layout";
import { SORTEO } from "~/components/admin/mock-data";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type IconCmp = ComponentType<{ className?: string; stroke?: number | string }>;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right font-medium">{children}</div>
    </div>
  );
}

function SettingCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: IconCmp;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-[18px] text-muted-foreground" stroke={1.75} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y">{children}</div>
      </CardContent>
    </Card>
  );
}

const porDefinir = (
  <Badge variant="outline" className="font-normal text-muted-foreground">
    Por definir
  </Badge>
);

export default function ConfiguracionPage() {
  return (
    <AdminLayout
      title="Configuración"
      description="Los ajustes de tu tienda. Algunos se definen contigo antes de lanzar."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <SettingCard
          icon={IconPalette}
          title="Identidad de marca"
          description="El nombre y la imagen visual de tu tienda."
        >
          <Row label="Nombre de la tienda">{porDefinir}</Row>
          <Row label="Colores y tipografía">{porDefinir}</Row>
          <Row label="Logo">{porDefinir}</Row>
        </SettingCard>

        <SettingCard
          icon={IconCreditCard}
          title="Pagos (Flow)"
          description="Para cobrar y recibir el dinero en tu cuenta."
        >
          <Row label="Conexión con Flow">
            <Badge variant="outline" className="font-normal text-muted-foreground">
              No conectado
            </Badge>
          </Row>
          <Row label="Cuenta bancaria">{porDefinir}</Row>
          <div className="pt-3">
            <Button variant="outline" size="sm">
              Conectar Flow
            </Button>
          </div>
        </SettingCard>

        <SettingCard
          icon={IconCloudUpload}
          title="Entrega de archivos"
          description="Dónde se guardan los PDF y cómo se entregan."
        >
          <Row label="Almacenamiento de PDF">{porDefinir}</Row>
          <Row label="Marca de agua por comprador">{porDefinir}</Row>
          <Row label="Expiración del enlace">
            <span className="text-muted-foreground">10 minutos</span>
          </Row>
        </SettingCard>

        <SettingCard
          icon={IconTicket}
          title="Sorteo"
          description="Los valores por defecto del sorteo activo."
        >
          <Row label="Premio">{SORTEO.premio}</Row>
          <Row label="Fecha del sorteo">{SORTEO.fechaSorteo}</Row>
          <Row label="Bases legales">{porDefinir}</Row>
        </SettingCard>

        <SettingCard
          icon={IconUserCircle}
          title="Tu cuenta"
          description="Acceso al panel de administración."
        >
          <Row label="Administradora">La autora</Row>
          <Row label="Acceso">
            <span className="text-muted-foreground">Con tu cuenta de Google</span>
          </Row>
        </SettingCard>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Vista de demostración · los datos son de ejemplo y los ajustes aún no guardan cambios.
      </p>
    </AdminLayout>
  );
}
