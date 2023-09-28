const path = require('path');
const PDFDocument = require("pdfkit-table");
const getStream = require('get-stream');
const { numberFormat, dateFormat, isFile, isNumber } = require('../tools/Tools');

class RepCliente {

    async repGeneral(req, sedeInfo, data) {
        try {
            const doc = new PDFDocument({
                font: 'Helvetica',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            doc.info["Title"] = "REPORTE DE CLIENTES.pdf"

            let orgX = doc.x;
            let orgY = doc.y;
            let cabeceraY = orgY + 70;
            let titleX = orgX + 150;
            let widthContent = doc.page.width - doc.options.margins.left - doc.options.margins.right;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;

            if (isFile(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo))) {
                doc.image(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo), orgX, orgY, { width: 75 });
            } else {
                doc.image(path.join(__dirname, "..", "path/to/noimage.jpg"), orgX, orgY, { width: 75 });
            }

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                titleX,
                orgY,
                {
                    width: 250,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `RUC: ${sedeInfo.ruc}\n${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`,
                titleX,
                orgY + 17,
                {
                    width: 250,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                `${req.query.idCliente === "" ? "REPORTE DE CLIENTES" : "LISTA DE APORTACIONES"}`,
                doc.options.margins.left,
                cabeceraY,
                {
                    width: widthContent,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                `PROYECTO: ${req.query.nombreProyecto}`,
                orgX,
                doc.y + 10,
                {
                    align: "left",
                }
            );

            if (req.query.idCliente !== "") {

                if (data.length === 0) {
                    doc.fontSize(h3).text(
                        `${"No existe datos relacionados"}`,
                        doc.options.margins.left,
                        doc.y + 135,
                        {
                            width: widthContent,
                            align: "center",
                        }
                    );
                }

                let i = 0
                while (i < data.length) {

                    doc.fontSize(h3).text(
                        `${"VENTA N° "}` + (i + 1),
                        doc.options.margins.left,
                        doc.y + 15,
                        {
                            width: widthContent,
                            align: "center",
                        }
                    );

                    const table = {
                        headers: ["N°", "Documento", "Cliente", "Manzana", "Lote", "Ctas.", "Cta. Mensual", "Cta. Total", "Tipo Cta."],
                        rows: [
                            [i + 1, data[i].nameDocument + "\n" + data[i].documento, data[i].informacion, data[i].nameManzana, data[i].nameLote, data[i].cuoTotal, numberFormat(data[i].cuotaMensual), numberFormat(data[i].precio), data[i].frecuenciaName]
                        ],
                    };
                    // doc.table(tableArray, { width: 300, }); // A4 595.28 x 841.89 (portrait) (about width sizes)

                    doc.table(table, {
                        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                            doc.font("Helvetica").fontSize(h3).fillColor("black");
                        },
                        align: "center",
                        padding: 5,
                        columnSpacing: 5,
                        columnsSize: [27, 70, 110, 70, 45, 35, 55, 65, 65],//792-712
                        x: doc.x,
                        y: doc.y + 15,
                        width: doc.page.width - doc.options.margins.left - doc.options.margins.right
                    });

                    // move to down
                    doc.moveDown(); // separate tables

                    doc.fontSize(h3).text(
                        `${"DETALLE DE LA VENTA N° "}` + (i + 1),
                        doc.options.margins.left,
                        doc.y + 15,
                        {
                            width: widthContent,
                            align: "center",
                        }
                    );

                    let contentDetalle = [];
                    let ini = 0;
                    for (const indexDeatil of data[i].detail) {
                        ++ini;
                        contentDetalle.push([
                            i + 1 + '.' + ini,
                            indexDeatil.fecha,
                            indexDeatil.comprobante + "\n" + indexDeatil.serie + '-' + indexDeatil.numeracion,
                            indexDeatil.detalle,
                            indexDeatil.banco,
                            indexDeatil.comprobanteRef,
                            numberFormat(indexDeatil.monto)
                        ]);
                    }

                    const tableDetalle = {
                        headers: ["N°", "Fecha", "Comprobante", "Detalle", "Banco", "Comprobante Ref.", "Monto"],
                        rows: contentDetalle,
                    };

                    doc.table(tableDetalle, {
                        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                            doc.font("Helvetica").fontSize(h3).fillColor("black");
                        },
                        align: "center",
                        padding: 5,
                        columnSpacing: 5,
                        columnsSize: [35, 70, 110, 70, 70, 100, 50],//792-712
                        x: doc.x,
                        y: doc.y + 15,
                        width: doc.page.width - doc.options.margins.left - doc.options.margins.right
                    });

                    if (data[i].detail.length == 0) {
                        doc.fontSize(h3).text(
                            `${"No existe datos registrados."}`,
                            doc.options.margins.left,
                            doc.y,
                            {
                                width: widthContent,
                                align: "center",
                            }
                        );

                        doc.moveDown(2);
                    } else {
                        // move to down
                        doc.moveDown(2);
                    }

                    i++;
                }
            } else {

                if (data.length === 0) {
                    doc.fontSize(h3).text(
                        `${"No existe datos relacionados"}`,
                        doc.options.margins.left,
                        doc.y + 135,
                        {
                            width: widthContent,
                            align: "center",
                        }
                    );
                } else {
                    const content = data.map((item, index) => {
                        return [
                            ++index,
                            item.nameDocument + "\n" + item.documento,
                            item.informacion,
                            item.nameManzana,
                            item.nameLote,
                            item.cuoTotal,
                            numberFormat(item.cuotaMensual),
                            numberFormat(item.precio),
                            item.frecuenciaName
                        ];
                    });

                    const table = {
                        // subtitle: "DETALLE",
                        headers: ["N°", "Documento", "Cliente", "Manzana", "Lote", "Ctas.", "Cta. Mensual", "Cta. Total", "Tipo Cta."],
                        rows: content
                    };

                    doc.table(table, {
                        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                            doc.font("Helvetica").fontSize(h3).fillColor("black");
                        },
                        align: "center",
                        padding: 5,
                        columnSpacing: 5,
                        columnsSize: [27, 70, 110, 70, 45, 35, 55, 65, 65],//792-712
                        x: doc.x,
                        y: doc.y + 15,
                        width: doc.page.width - doc.options.margins.left - doc.options.margins.right
                    });
                }
            }

            doc.end();
            return getStream.buffer(doc);
        } catch (error) {
            console.error(error);
            return "Se genero un error al generar el reporte.";
        }
    }

    async repHistorial(req, sedeInfo, data) {
        try {
            const doc = new PDFDocument({
                font: 'Helvetica',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            doc.info["Title"] = "HISTORIAL DEL CLIENTE.pdf"

            let orgX = doc.x;
            let orgY = doc.y;
            let cabeceraY = orgY + 70;
            let titleX = orgX + 150;
            let medioX = doc.page.width / 2;
            let widthContent = doc.page.width - doc.options.margins.left - doc.options.margins.right;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;

            if (isFile(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo))) {
                doc.image(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo), orgX, orgY, { width: 75 });
            } else {
                doc.image(path.join(__dirname, "..", "path/to/noimage.jpg"), orgX, orgY, { width: 75 });
            }

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                titleX,
                orgY,
                {
                    width: 250,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `RUC: ${sedeInfo.ruc}\n${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`,
                titleX,
                orgY + 17,
                {
                    width: 250,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                "HISTORIAL DEL CLIENTE",
                doc.options.margins.left,
                cabeceraY,
                {
                    width: widthContent,
                    align: "center",
                }
            );

            doc.fill('#000').stroke('#000');
            doc.lineGap(4);
            doc.opacity(1);


            let filtroY = doc.y;

            doc.fontSize(h3).text(
                `N° de Documento: ${data.cliente.tipoDocumento + " - " + data.cliente.documento}\nInformación: ${data.cliente.informacion}\nDirección: ${data.cliente.direccion}`,
                orgX,
                doc.y + 10,
                {
                    align: "left",
                }
            );

            doc.fontSize(h3).text(
                `Celular: ${data.cliente.celular}\nTeléfono: ${data.cliente.telefono}\nEmail: ${data.cliente.email}`,
                medioX,
                filtroY + 10
            );

            doc.lineGap(0);

            let ventas = data.venta.map((item, index) => {
                return [
                    ++index,
                    item.fecha,
                    item.comprobante + "\n" + item.serie + "-" + item.numeracion,
                    numberFormat(item.total, item.codigo)
                ]
            })

            const ventasTabla = {
                subtitle: `Historial`,
                headers: ["N°", "FECHA", "COMPROBANTE", "TOTAL"],
                rows: ventas
            };

            doc.table(ventasTabla, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: () => {
                    doc.font("Helvetica").fontSize(h3);
                },
                padding: 5,
                columnSpacing: 5,
                columnsSize: [40, 172, 230, 90],//532
                width: (doc.page.width - doc.options.margins.left - doc.options.margins.right),
                x: orgX,
                y: doc.y + 15,

            });

            doc.end();
            return getStream.buffer(doc);
        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }

    async repDeudas(req, sedeInfo, data) {
        try {
            const doc = new PDFDocument({
                font: 'Helvetica',
                layout: 'landscape',
                margins: {
                    top: 40,
                    bottom: 35,
                    left: 35,
                    right: 35
                }
            });

            doc.info["Title"] = "LISTA DE DEUDAS"

            let orgX = doc.x;
            let orgY = doc.y;
            let cabeceraY = orgY + 70;
            let titleX = orgX + 230;
            let widthContent = doc.page.width - doc.options.margins.left - doc.options.margins.right;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;
            let h4 = 7;

            if (isFile(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo))) {
                doc.image(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo), orgX, orgY, { width: 75 });
            } else {
                doc.image(path.join(__dirname, "..", "path/to/noimage.jpg"), orgX, orgY, { width: 75 });
            }

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                titleX,
                orgY,
                {
                    width: 250,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `RUC: ${sedeInfo.ruc}\n${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`,
                titleX,
                orgY + 17,
                {
                    width: 250,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                `LISTA DE DEUDAS POR CLIENTE `,
                doc.options.margins.left,
                cabeceraY,
                {
                    width: widthContent,
                    align: "center",
                }
            );

            doc.fontSize(h3).text(
                `${req.query.seleccionado ? "TODAS LA FECHAS" : req.query.frecuencia == 15 ? "FRECUENTA CADA 15 DEL MES" : "FRECUENTA CADA 30 DEL MES"}`,
                orgX,
                doc.y + 10,
                {
                    align: "left",
                }
            );

            doc.fontSize(h3).text(
                `PROYECTO: ${req.query.nombreProyecto}`,
                orgX,
                doc.y + 10,
                {
                    align: "left",
                }
            );

            const content = data.map((item, index) => {
                return [
                    ++index,
                    item.documento + " " + item.informacion,
                    item.lote,
                    item.nombre + "\n" + item.serie + "-" + item.numeracion,
                    numberFormat(item.cuotaMensual),
                    item.numCuota == 1 ? item.numCuota + " COUTA" : item.numCuota + " CUOTAS",
                    dateFormat(item.fechaPago),
                    numberFormat(item.total, item.codiso),
                    numberFormat(item.cobrado, item.codiso),
                    numberFormat(item.total - item.cobrado, item.codiso),
                ];
            });

            const table = {
                subtitle: "DETALLE",
                headers: ["N°", "Cliente", "Propiedad", "Comprobante", "Cta mensual", "Cuotas Pendientes", "Sig. Pago", "Total", "Cobrado", "Por Cobrar"],
                rows: content
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                    if (indexColumn === 8) {
                        doc.font("Helvetica").fontSize(h3).fillColor("red");
                    } else if (indexColumn === 7) {
                        doc.font("Helvetica").fontSize(h3).fillColor("green");
                    } else {
                        doc.font("Helvetica").fontSize(h3).fillColor("black");
                    }
                },
                align: "center",
                padding: 5,
                columnSpacing: 5,
                columnsSize: [25, 130, 75, 90, 60, 70, 65, 70, 70, 65],//792-712
                x: doc.x,
                y: doc.y + 15,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });

            doc.end();
            return getStream.buffer(doc);
        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }

    async repListarSociosPorFecha(req, sedeInfo, clientes) {
        try {
            const doc = new PDFDocument({
                font: 'Helvetica',
                layout: 'portrait',
                margins: {
                    top: 40,
                    bottom: 40,
                    left: 40,
                    right: 40
                }
            });

            doc.info["Title"] = "REPORTE DE SOCIOS AGREGADOS POR FECHA.pdf"

            let orgX = doc.x;
            let orgY = doc.y;
            let cabeceraY = orgY + 70;
            let titleX = orgX + 150;
            let widthContent = doc.page.width - doc.options.margins.left - doc.options.margins.right;

            let h1 = 13;
            let h2 = 11;
            let h3 = 9;
            let h4 = 8;

            if (isFile(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo))) {
                doc.image(path.join(__dirname, "..", "path/company/" + sedeInfo.rutaLogo), orgX, orgY, { width: 75 });
            } else {
                doc.image(path.join(__dirname, "..", "path/to/noimage.jpg"), orgX, orgY, { width: 75 });
            }

            doc.fontSize(h1).text(
                `${sedeInfo.nombreEmpresa}`,
                titleX,
                orgY,
                {
                    width: 250,
                    align: "center"
                }
            );

            doc.fontSize(h3).text(
                `RUC: ${sedeInfo.ruc}\n${sedeInfo.direccion}\nCelular: ${sedeInfo.celular} / Telefono: ${sedeInfo.telefono}`,
                titleX,
                orgY + 17,
                {
                    width: 250,
                    align: "center",
                }
            );

            doc.fontSize(h2).text(
                "LISTA DE SOCIOS AGREGADOS POR FECHA",
                doc.options.margins.left,
                cabeceraY,
                {
                    width: widthContent,
                    align: "center",
                }
            );

            doc.fontSize(h3).text(
                req.query.porProyecto == "1" ? "TODOS LOS PROYECTOS" : `PROYECTO: ${req.query.nombreProyecto}`,
                orgX,
                doc.y + 10,
                {
                    align: "left",
                }
            );

            let content = [];
            let index = 0;
            for (const cliente of clientes) {
                index++;
                content.push(
                    [
                        index,
                        cliente.documento,
                        cliente.informacion,
                        cliente.celular,
                        cliente.telefono,
                    ]
                );

                content.push(
                    [
                        "COMPROBANTE",
                        "FECHA",
                        "LOTE",
                        "FRECUENCIA",
                        "MONTO TOTAL",
                    ]
                );

                for (const venta of cliente.detalle) {
                    content.push(
                        [
                            venta.serie + "-" + venta.numeracion,
                            venta.fecha,
                            venta.lote + " - " + venta.manzana,
                            venta.frecuencia,
                            numberFormat(venta.monto, venta.codiso),
                        ]
                    );
                }
            }

            const table = {
                subtitle: "DETALLE",
                headers: ["N°", "Documento", "Socio", "Celular", "Telefono"],
                rows: content
            };

            doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(h3),
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {

                    if (isNumber(row[0])) {
                        doc.font("Helvetica").fontSize(h3);
                        doc.addBackground(rectRow, 'blue', 0.05);
                    } else {
                        if (row[0] == "COMPROBANTE") {
                            doc.font("Helvetica-Bold").fontSize(h4);
                            doc.addBackground(rectRow, 'black', 0.02);
                        }

                        if (row[0] != "COMPROBANTE") {
                            doc.font("Helvetica").fontSize(h4);
                        }
                    }

                },
                align: "center",
                padding: 5,
                columnSpacing: 5,
                columnsSize: [90, 102, 160, 90, 90],//532
                x: doc.x,
                y: doc.y + 15,
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });

            doc.end();
            return getStream.buffer(doc);
        } catch (error) {
            return "Se genero un error al generar el reporte.";
        }
    }

}

module.exports = RepCliente;