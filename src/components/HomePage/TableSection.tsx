import React from "react"
import { CSSProperties } from "aphrodite"
import { useStyle, scales } from "styles"

import { Table } from "data/tables"
import { media, fonts } from "styles"
import Description from "./Description"
import PolyhedronTable from "./PolyhedronTable"
import { TableSection as TableSectionType } from "./tableSections"
import { flexColumn, paddingHoriz } from "styles/common"

const sectionMapping: Record<string, string> = {
  "Uniform Polyhedra": "uniform",
  "Johnson Solids": "johnson",
  "Pyramids, Cupolæ, and Rotundæ": "capstones",
  "Augmented, Diminished, and Gyrate Polyhedra": "cutPaste",
  "Elementary Johnson Solids": "elementary",
}

const gridAreaMapping: Record<string, string> = {
  "Platonic and Archimedean Solids": "plato",
  "Prisms and Antiprisms": "prism",
  "Pyramids, Cupolæ, and Rotundæ": "caps",
  "Bipyramids, Cupolæ, and Rotundæ": "bi",
  "Augmented Polyhedra": "aug",
  "Diminished Icosahedra": "icos",
  "Gyrate and Diminished Rhombicosidodecahedra": "rhombicos",
  "Gyrate Rhombicosidodecahedra": "gyr",
  "Diminished Rhombicosidodecahedra": "dim",
  "Snub Antiprisms": "snub",
  "Other Johnson Solids": "other",
}

const sectionStyles: Record<string, CSSProperties> = {
  // Section styles
  uniform: {
    gridTemplateAreas: `
      "plato prism"
    `,
    [media.mobile]: {
      gridTemplateAreas: `
      "plato"
      "prism"
    `,
    },
  },

  capstones: {
    gridTemplateAreas: `"caps"`,
    [media.mobilePortrait]: {
      gridTemplateAreas: `"caps" "bi"`,
    },
  },

  cutPaste: {
    gridTemplateAreas: `
      "aug"
      "icos"
      "rhombicos"
    `,
    [media.desktop]: {
      gridTemplateAreas: `
        "aug  icos"
        "aug  rhombicos"
      `,
    },
    [media.mobilePortrait]: {
      gridTemplateAreas: `
        "aug"
        "icos"
        "gyr"
        "dim"
      `,
    },
  },

  elementary: {
    gridColumnGap: scales.spacing[4],
    gridTemplateAreas: `
      "snub"
      "other"
    `,
    [media.desktop]: {
      gridTemplateAreas: '"snub other"',
    },
  },
}

const GridArea = ({ area, data }: { area: string; data: Table }) => {
  return (
    <div style={{ gridArea: area }}>
      <PolyhedronTable {...data} />
    </div>
  )
}

const TableGrid = ({
  tables,
  header,
}: Pick<TableSectionType, "tables" | "header">) => {
  const css = useStyle(
    {
      display: "grid",
      gridGap: scales.spacing[4],
      justifyItems: "center",
      ...sectionStyles[sectionMapping[header]],
    },
    [header],
  )
  return (
    <div {...css()}>
      {tables!.map(table => {
        const area = gridAreaMapping[table.caption]
        return <GridArea key={area} area={area} data={table} />
      })}
    </div>
  )
}

function Heading({ subsection, text }: { subsection: boolean; text: string }) {
  const H = subsection ? "h3" : "h2"
  const css = useStyle({
    marginBottom: scales.spacing[3],
    fontFamily: fonts.times,
    fontSize: subsection ? scales.font[4] : scales.font[3],
  })
  return <H {...css()}>{text}</H>
}

interface Props {
  data: TableSectionType
  narrow?: boolean
  isSubsection?: boolean
}

export default function TableSection({
  data,
  narrow = false,
  isSubsection = false,
}: Props) {
  const {
    header,
    description,
    tables,
    narrowTables,
    subsections,
    sticky,
  } = data

  const css = useStyle({
    ...flexColumn("center"),
    ":not(:last-child)": {
      marginBottom: scales.spacing[5],
    },
  })

  const textCss = useStyle({
    ...flexColumn("center"),
    maxWidth: scales.size[7],
    marginBottom: scales.spacing[4],
    // add padding to the side in case we shrink too much
    [media.notMobile]: paddingHoriz(scales.spacing[5]),
    [media.mobile]: paddingHoriz(scales.spacing[4]),
  })

  return (
    <section {...css()}>
      <div {...textCss()}>
        <Heading subsection={isSubsection} text={header} />
        <Description title={header} content={description} collapsed={!sticky} />
      </div>
      {tables && (
        <TableGrid
          header={header}
          tables={narrow ? narrowTables ?? tables : tables}
        />
      )}
      {subsections &&
        subsections.map(subsection => (
          <TableSection
            key={subsection.header}
            narrow={narrow}
            isSubsection
            data={subsection}
          />
        ))}
    </section>
  )
}
