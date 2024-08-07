import React from 'react'
import { CButton, CDropdownItem } from '@coreui/react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilePdf } from '@fortawesome/free-solid-svg-icons'
import { useSelector } from 'react-redux'

function ExportPDFButton(props) {
  const base64 = useSelector((state) => state.app.reportImage)
  const exportPDF = (pdfData, pdfHeaders, pdfSize = 'A3', reportName = 'report') => {
    const unit = 'pt'
    const size = pdfSize // Use A1, A2, A3 or A4
    const orientation = 'landscape' // portrait or landscape
    const doc = new jsPDF(orientation, unit, size)

    doc.setFontSize(10)
    let headerObj = []
    pdfHeaders.forEach((item) => {
      if (item.exportSelector) {
        let returnobj = { header: item.name, dataKey: item.exportSelector }
        headerObj.push(returnobj)
      }
    })

    let content = {
      startY: 100,
      columns: headerObj,
      body: pdfData,
      theme: 'striped',
      headStyles: { fillColor: [0, 163, 224] },
    }
    if (base64) {
      doc.addImage(base64, 'png', 20, 20, 120, 100)
    }
    doc.autoTable(content)
    doc.save(reportName + '.pdf')
  }

  return (
    <CDropdownItem
      onClick={() => exportPDF(props.pdfData, props.pdfHeaders, props.pdfSize, props.reportName)}
    >
      <FontAwesomeIcon className="me-2" icon={faFilePdf} />
      {props.nameText}
    </CDropdownItem>
  )
}
export default ExportPDFButton

ExportPDFButton.propTypes = {
  pdfData: PropTypes.oneOfType([PropTypes.element, PropTypes.string, PropTypes.array]),
  pdfHeaders: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  pdfSize: PropTypes.oneOf(['A1', 'A2', 'A3', 'A4']),
  reportName: PropTypes.oneOfType([PropTypes.element, PropTypes.string, PropTypes.number]),
  nameText: PropTypes.string,
}
