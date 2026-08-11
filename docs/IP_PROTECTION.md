# Intellectual Property Protection — PZ Community

> **DISCLAIMER:** This document is an internal checklist and does not constitute
> legal advice. For any formal intellectual property matters, consult a qualified
> Brazilian IP attorney.
>
> TODO: REVIEW WITH BRAZILIAN IP ATTORNEY

---

## Purpose

This document serves as an internal reference for the intellectual property
protection strategy of the PZ Community / Brasileirão PZ ecosystem.

It describes practical steps to document, protect, and enforce ownership of
the software, brand, content, and visual identity developed under the project.

---

## 1. Identifying the Rights Holder

| Item | Status |
|---|---|
| Technical author | Lucas Buneo de Camargo (GitHub: lbcamargo94) |
| Legal holder of the software | Lucas Buneo de Camargo / PZ Community |
| Collaborators with IP agreements | TODO: LIST AND CONFIRM |
| Assets created by third parties | TODO: CATALOG AND CONFIRM LICENSES/ASSIGNMENTS |

---

## 2. Software — Registro de Programa de Computador (INPI)

Brazilian law (Lei 9.609/1998 — Lei de Software) protects computer programs
automatically from the moment of creation, but formal registration at INPI
provides additional evidentiary benefits and legal standing.

### Checklist

- [ ] Identify the list of software components to register
- [ ] Prepare source code deposits (at least 30% of source code per INPI rules)
- [ ] Confirm the holder name and CPF/CNPJ for registration
- [ ] Submit registration via INPI's online system (e-INPI)
- [ ] Keep proof of submission and registration numbers

**Components to consider:**
- PZ Community Rank (frontend + backend)
- PZ Rank Companion
- Official mods (PZCommunityRank, PZ-Dayvinho-Blessings, etc.)

**Reference:** https://www.gov.br/inpi/pt-br/servicos/programas-de-computador

TODO: REVIEW WITH BRAZILIAN IP ATTORNEY BEFORE SUBMITTING

---

## 3. Brand — Registro de Marca (INPI)

Names and logos may be eligible for trademark registration in Brazil under the
Lei 9.279/1996 (Lei de Propriedade Industrial).

### Names to evaluate

| Identifier | Status |
|---|---|
| PZ Community | TODO: CHECK AVAILABILITY AND FILE IF VIABLE |
| PZ Community Rank | TODO: CHECK AVAILABILITY AND FILE IF VIABLE |
| Brasileirão PZ | TODO: CHECK AVAILABILITY AND FILE IF VIABLE |

### Checklist

- [ ] Conduct trademark availability search (INPI search tool)
- [ ] Define the appropriate NCL classes for filing
- [ ] Prepare application materials
- [ ] File with INPI and monitor opposition period
- [ ] Maintain use and renewal obligations

**Reference:** https://www.gov.br/inpi/pt-br/servicos/marcas

TODO: REVIEW WITH BRAZILIAN IP ATTORNEY BEFORE FILING

---

## 4. Evidence of Authorship and Timeline

Even without formal registration, maintaining a clear and verifiable record of
creation is essential for establishing ownership.

### Checklist

- [x] Git repository with full commit history (GitHub — lbcamargo94)
- [x] Version tags on every release (`git tag vX.Y.Z`)
- [x] GitHub Releases with release notes and binaries
- [ ] Archive signed releases with SHA-256 checksums
- [ ] Maintain offline backups of the full git history
- [ ] Keep development records (screenshots, early versions, design documents)

---

## 5. Collaborator and Asset Agreements

Any code, art, or content contributed by third parties should be documented.

### Checklist

- [ ] Identify all contributors to the codebase
- [ ] Confirm whether contributions require a formal IP assignment or CLA
  (Contributor License Agreement)
- [ ] Catalog all third-party assets (icons, fonts, art) and confirm their
  licenses and attribution requirements
- [ ] Keep copies of all license agreements and asset credits

---

## 6. Asset Protection

- [ ] Watermark original artwork when distributing publicly
- [ ] Maintain source files (PSD, AI, SVG) for all official artwork
- [ ] Document the date and author of each visual asset
- [ ] Include copyright notices in UI where appropriate

---

## 7. License and Terms Enforcement

- [ ] Ensure LICENSE file is present in all repositories
- [ ] Ensure TERMS_OF_USE.md is published and accessible from the website
- [ ] Define a process for reporting and responding to infringement
- [ ] TODO: ADD OFFICIAL DMCA / IP VIOLATION CONTACT EMAIL

---

## 8. Steam Workshop Compliance

Mods distributed via Steam Workshop are subject to Steam's policies in addition
to the project's proprietary license.

### Análise de compatibilidade (2026)

Ao publicar um mod no Steam Workshop, o criador concede à Valve uma licença
mundial, não-exclusiva, gratuita e perpétua para usar, reproduzir, modificar
e distribuir o conteúdo (Steam Subscriber Agreement, Seção 6). Essa concessão
é obrigatória e inerente ao uso da plataforma.

**A licença proprietária PZ Community é compatível com o Steam Workshop**,
operando em camadas:

| Situação | Quem controla |
| --- | --- |
| Download via Steam Workshop | Steam Subscriber Agreement |
| Distribuição pela Valve na plataforma | Licença concedida ao subir |
| Mirrors não-oficiais fora do Steam | Licença proprietária (proíbe) |
| Republicação fora dos canais oficiais | Licença proprietária (proíbe) |
| Uso do código em outro projeto | Licença proprietária (proíbe) |
| Modificação e redistribuição externa | Licença proprietária (proíbe) |

A cláusula presente em todos os arquivos LICENSE dos mods está correta:

> "This License applies in addition to — and not in substitution of —
> the Steam Subscriber Agreement and Steam Workshop Terms of Service."

### Checklist — Steam Workshop

- [x] Compatibilidade com o Steam Subscriber Agreement confirmada (2026)
- [x] Cláusula de coexistência com os termos Steam presente em todos os mod LICENSEs
- [ ] Verificar política de modding da The Indie Stone (projectzomboid.com)
      — improvável conflito, mas recomendado confirmar manualmente
- [ ] Garantir que as descrições das páginas Workshop referenciem a licença proprietária

**Reference:** https://store.steampowered.com/subscriber_agreement/

---

## 9. Documentation and Recordkeeping

- [ ] Archive each release version with metadata (date, version, author, hash)
- [ ] Maintain a changelog documenting what was added/changed in each version
- [ ] Store original contract or agreement documents related to the project
- [ ] Keep records of any third-party license agreements

---

## 10. Version History of This Document

| Version | Date | Notes |
|---|---|---|
| 1.0 | 2026 | Initial internal checklist |

---

*This document does not constitute legal advice. Consult a qualified Brazilian
intellectual property attorney for formal guidance.*

TODO: REVIEW WITH BRAZILIAN IP ATTORNEY
