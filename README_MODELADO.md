# Modelado de Base de Datos - OtakuVault

## Descripción General
Sistema de gestión para una plataforma de animes y mangas con funcionalidades de usuarios, carrito de compras, órdenes y listas personalizadas.

---

## 3. Tablas Principales y su Propósito

| Tabla                    | Propósito                              | Relaciones importantes |
|-------------------------|----------------------------------------|------------------------|
| `roles`                 | Roles del sistema (admin, cliente)     | 1:N → usuarios |
| `usuarios`              | Registro de usuarios                   | N:1 → roles, 1:N → órdenes, carrito |
| `generos`               | Géneros de anime y manga               | N:N → animes y mangas |
| `animes`                | Catálogo de animes                     | N:N → géneros |
| `mangas`                | Productos para venta + Inventario      | N:N → géneros, 1:N → órdenes |
| `ordenes`               | Registro de compras (Ventas)           | N:1 → usuarios |
| `orden_detalle`         | Detalle de cada venta                  | N:1 → ordenes y mangas |
| `movimientos_inventario`| Historial de movimientos de stock      | N:1 → mangas |
| `carrito`               | Carrito temporal de compras            | N:1 → usuarios y mangas |
| `listas_usuario`      | Listas personalizadas (ver después, etc)| N:1 → usuarios |
| `lista_items`         | Items dentro de cada lista             | N:1 → listas_usuario |

---

## Diagrama Entidad-Relación

```
┌─────────────┐           ┌─────────────┐
│   roles     │           │ usuarios    │
│-------------│           │-------------│
│ id (PK)     │<──────────│ id (PK)     │
│ nombre      │           │ username    │
└─────────────┘           │ email       │
                          │ rol_id (FK) │
                          └─────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────┐         ┌─────────────┐      ┌─────────────┐
│ generos     │<------->│ animes      │      │ mangas      │
│-------------│         │-------------│      │-------------│
│ id (PK)     │         │ id (PK)     │      │ id (PK)     │
│ nombre      │         │ titulo      │      │ titulo      │
└─────────────┘         │ precio      │      │ precio      │
       │                └─────────────┘      │ stock       │
       │                        │             └─────────────┘
       │              ┌─────────┴─────────┐         │
       │              │                   │         │
       ▼              ▼                   ▼         ▼
┌──────────────┐ ┌──────────────┐      │  ┌──────────────┐
│anime_generos │ │manga_generos │      │  │ movimientos_ │
│--------------│ │--------------│      │  │ inventario   │
│anime_id (FK) │ │manga_id (FK)│      │  │--------------│
│genero_id (FK)│ │genero_id (FK)│      │  │ manga_id (FK)│
└──────────────┘ └──────────────┘      │  └──────────────┘
                                        │
┌─────────────┐                          │
│ ordenes     │<─────────────────────────┘
│-------------│
│ id (PK)     │
│ usuario_id  │
│ total       │
└─────────────┘
       │
       ▼
┌─────────────┐
│ orden_detalle│
│-------------│
│ id (PK)     │
│ orden_id    │
│ manga_id    │
│ subtotal    │
└─────────────┘

┌─────────────┐
│ carrito     │
│-------------│
│ id (PK)     │
│ usuario_id  │
│ manga_id    │
└─────────────┘

┌─────────────┐
│listas_usuario│
│-------------│
│ id (PK)     │
│ usuario_id  │
└─────────────┘
       │
       ▼
┌─────────────┐
│ lista_items │
│-------------│
│ id (PK)     │
│ lista_id    │
│ anime_id/manga_id
└─────────────┘
```

---

## Relaciones entre Tablas

### Relaciones 1:N (Uno a Muchos)
| Tabla Padre | Tabla Hijo | Clave Foránea |
|-------------|------------|---------------|
| usuarios | carrito | usuario_id |
| usuarios | listas_usuario | usuario_id |
| usuarios | ordenes | usuario_id |
| mangas | carrito | manga_id |
| mangas | orden_detalle | manga_id |
| mangas | movimientos_inventario | manga_id |
| animes | lista_items | anime_id |
| mangas | lista_items | manga_id |
| listas_usuario | lista_items | lista_id |
| ordenes | orden_detalle | orden_id |

### Relaciones N:M (Muchos a Muchos)
| Tabla Intermedia | Tabla A | Tabla B |
|------------------|---------|---------|
| anime_generos | animes | generos |
| manga_generos | mangas | generos |

---

## Restricciones Validadas

1. **LISTA_ITEMS**: CHECK constraint que asegura que solo se pueda guardar anime_id O manga_id (no ambos, no ninguno).

2. **MANGAS.STOCK**: CHECK constraint que asegura stock >= 0.

3. **CARRITO**: UNIQUE constraint que evita duplicados de un mismo manga para un mismo usuario.

4. **CASCADA**: Las eliminaciones usan ON DELETE CASCADE para mantener integridad referencial.