"""
PDF和Excel导出工具
"""
import io
from datetime import date
from decimal import Decimal
from typing import List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill


def get_chinese_font():
    """尝试注册中文字体"""
    try:
        # 尝试使用系统字体
        pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
        return 'SimHei'
    except:
        return 'Helvetica'


def generate_bill_pdf(bill_data: dict, organization_name: str) -> bytes:
    """
    生成账单PDF

    Args:
        bill_data: 账单数据字典
        organization_name: 组织名称

    Returns:
        PDF文件的字节数据
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=1  # 居中
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=20,
        spaceAfter=10
    )

    elements = []

    # 标题
    elements.append(Paragraph(f"{organization_name} - 账单", title_style))
    elements.append(Spacer(1, 20))

    # 账单基本信息
    info_data = [
        ["账单编号:", f"#{bill_data['id']}"],
        ["账单周期:", f"{bill_data['bill_year']}年{bill_data['bill_month']}月"],
        ["到期日期:", str(bill_data['due_date'])],
        ["账单状态:", bill_data['status']],
    ]
    info_table = Table(info_data, colWidths=[3*cm, 8*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))

    # 房间和租客信息
    elements.append(Paragraph("房间信息", heading_style))
    room_data = [
        ["公寓:", bill_data.get('apartment_name', '-')],
        ["房间:", bill_data.get('room_number', '-')],
        ["租客:", bill_data.get('tenant_name', '-')],
    ]
    room_table = Table(room_data, colWidths=[3*cm, 8*cm])
    room_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(room_table)
    elements.append(Spacer(1, 20))

    # 费用明细
    elements.append(Paragraph("费用明细", heading_style))
    fee_data = [
        ["项目", "金额 (元)"],
        ["租金", f"{float(bill_data['rent_amount']):.2f}"],
        ["水费", f"{float(bill_data['water_amount']):.2f}"],
        ["电费", f"{float(bill_data['electricity_amount']):.2f}"],
        ["其他费用", f"{float(bill_data['other_amount']):.2f}"],
        ["合计", f"{float(bill_data['total_amount']):.2f}"],
    ]
    fee_table = Table(fee_data, colWidths=[6*cm, 5*cm])
    fee_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.Color(0.9, 0.9, 0.9)),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(fee_table)
    elements.append(Spacer(1, 20))

    # 付款信息
    elements.append(Paragraph("付款信息", heading_style))
    payment_data = [
        ["已付金额:", f"{float(bill_data['paid_amount']):.2f} 元"],
        ["待付金额:", f"{float(bill_data['total_amount'] - bill_data['paid_amount']):.2f} 元"],
    ]
    payment_table = Table(payment_data, colWidths=[3*cm, 8*cm])
    payment_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(payment_table)

    # 备注
    if bill_data.get('notes'):
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("备注", heading_style))
        elements.append(Paragraph(bill_data['notes'], styles['Normal']))

    # 页脚
    elements.append(Spacer(1, 40))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=1
    )
    elements.append(Paragraph(f"生成日期: {date.today().strftime('%Y-%m-%d')}", footer_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def generate_bills_excel(bills_data: List[dict], organization_name: str) -> bytes:
    """
    生成账单列表Excel

    Args:
        bills_data: 账单数据列表
        organization_name: 组织名称

    Returns:
        Excel文件的字节数据
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "账单列表"

    # 样式定义
    header_font = Font(bold=True, size=12)
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font_white = Font(bold=True, size=12, color="FFFFFF")
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    center_align = Alignment(horizontal='center', vertical='center')

    # 标题行
    ws.merge_cells('A1:L1')
    ws['A1'] = f"{organization_name} - 账单列表"
    ws['A1'].font = Font(bold=True, size=16)
    ws['A1'].alignment = center_align
    ws.row_dimensions[1].height = 30

    # 表头
    headers = [
        "账单ID", "账单周期", "公寓", "房间", "租客",
        "租金", "水费", "电费", "其他", "合计",
        "已付", "状态"
    ]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=3, column=col, value=header)
        cell.font = header_font_white
        cell.fill = header_fill
        cell.border = border
        cell.alignment = center_align

    # 数据行
    for row, bill in enumerate(bills_data, 4):
        ws.cell(row=row, column=1, value=bill['id']).border = border
        ws.cell(row=row, column=2, value=f"{bill['bill_year']}-{bill['bill_month']:02d}").border = border
        ws.cell(row=row, column=3, value=bill.get('apartment_name', '-')).border = border
        ws.cell(row=row, column=4, value=bill.get('room_number', '-')).border = border
        ws.cell(row=row, column=5, value=bill.get('tenant_name', '-')).border = border
        ws.cell(row=row, column=6, value=float(bill['rent_amount'])).border = border
        ws.cell(row=row, column=7, value=float(bill['water_amount'])).border = border
        ws.cell(row=row, column=8, value=float(bill['electricity_amount'])).border = border
        ws.cell(row=row, column=9, value=float(bill['other_amount'])).border = border
        ws.cell(row=row, column=10, value=float(bill['total_amount'])).border = border
        ws.cell(row=row, column=11, value=float(bill['paid_amount'])).border = border
        ws.cell(row=row, column=12, value=bill['status']).border = border

        # 金额列右对齐
        for col in range(6, 12):
            ws.cell(row=row, column=col).alignment = Alignment(horizontal='right')
            ws.cell(row=row, column=col).number_format = '#,##0.00'

    # 设置列宽
    column_widths = [8, 12, 15, 10, 12, 10, 10, 10, 10, 10, 10, 10]
    for i, width in enumerate(column_widths, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = width

    # 汇总行
    summary_row = len(bills_data) + 5
    ws.cell(row=summary_row, column=1, value="合计").font = Font(bold=True)
    ws.cell(row=summary_row, column=10, value=sum(float(b['total_amount']) for b in bills_data))
    ws.cell(row=summary_row, column=10).font = Font(bold=True)
    ws.cell(row=summary_row, column=10).number_format = '#,##0.00'
    ws.cell(row=summary_row, column=11, value=sum(float(b['paid_amount']) for b in bills_data))
    ws.cell(row=summary_row, column=11).font = Font(bold=True)
    ws.cell(row=summary_row, column=11).number_format = '#,##0.00'

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()


def generate_utility_excel(readings_data: List[dict], organization_name: str) -> bytes:
    """
    生成水电读数Excel

    Args:
        readings_data: 水电读数数据列表
        organization_name: 组织名称

    Returns:
        Excel文件的字节数据
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "水电读数"

    # 样式定义
    header_fill = PatternFill(start_color="70AD47", end_color="70AD47", fill_type="solid")
    header_font = Font(bold=True, size=12, color="FFFFFF")
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )

    # 标题行
    ws.merge_cells('A1:K1')
    ws['A1'] = f"{organization_name} - 水电读数记录"
    ws['A1'].font = Font(bold=True, size=16)
    ws['A1'].alignment = Alignment(horizontal='center', vertical='center')
    ws.row_dimensions[1].height = 30

    # 表头
    headers = [
        "ID", "周期", "公寓", "房间", "抄表日期",
        "水(上期)", "水(本期)", "水(用量)",
        "电(上期)", "电(本期)", "电(用量)"
    ]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=3, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.border = border
        cell.alignment = Alignment(horizontal='center')

    # 数据行
    for row, reading in enumerate(readings_data, 4):
        ws.cell(row=row, column=1, value=reading['id']).border = border
        ws.cell(row=row, column=2, value=f"{reading['period_year']}-{reading['period_month']:02d}").border = border
        ws.cell(row=row, column=3, value=reading.get('apartment_name', '-')).border = border
        ws.cell(row=row, column=4, value=reading.get('room_number', '-')).border = border
        ws.cell(row=row, column=5, value=str(reading['reading_date'])).border = border

        water_prev = reading.get('water_previous') or 0
        water_curr = reading.get('water_reading') or 0
        elec_prev = reading.get('electricity_previous') or 0
        elec_curr = reading.get('electricity_reading') or 0

        ws.cell(row=row, column=6, value=water_prev).border = border
        ws.cell(row=row, column=7, value=water_curr).border = border
        ws.cell(row=row, column=8, value=water_curr - water_prev).border = border
        ws.cell(row=row, column=9, value=elec_prev).border = border
        ws.cell(row=row, column=10, value=elec_curr).border = border
        ws.cell(row=row, column=11, value=elec_curr - elec_prev).border = border

    # 设置列宽
    for i in range(1, 12):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = 12

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()


def generate_lease_pdf(lease_data: dict, organization_name: str) -> bytes:
    """
    生成租约PDF

    Args:
        lease_data: 租约数据字典
        organization_name: 组织名称

    Returns:
        PDF文件的字节数据
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=1
    )

    elements = []

    # 标题
    elements.append(Paragraph(f"{organization_name} - 租约合同", title_style))
    elements.append(Spacer(1, 20))

    # 租约基本信息
    info_data = [
        ["租约编号:", f"#{lease_data['id']}"],
        ["房间:", lease_data.get('room_number', '-')],
        ["公寓:", lease_data.get('apartment_name', '-')],
        ["租客:", lease_data.get('tenant_name', '-')],
        ["联系电话:", lease_data.get('tenant_phone', '-')],
        ["起始日期:", str(lease_data['start_date'])],
        ["结束日期:", str(lease_data['end_date']) if lease_data.get('end_date') else "未指定"],
        ["月租金:", f"{float(lease_data['monthly_rent']):.2f} 元"],
        ["押金:", f"{float(lease_data['deposit']):.2f} 元"],
        ["水费单价:", f"{float(lease_data['water_rate']):.2f} 元/吨" if lease_data.get('water_rate') else "未设置"],
        ["电费单价:", f"{float(lease_data['electricity_rate']):.2f} 元/度" if lease_data.get('electricity_rate') else "未设置"],
        ["状态:", "生效中" if lease_data['is_active'] else "已终止"],
    ]

    info_table = Table(info_data, colWidths=[3*cm, 10*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(info_table)

    # 备注
    if lease_data.get('notes'):
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("备注", styles['Heading2']))
        elements.append(Paragraph(lease_data['notes'], styles['Normal']))

    # 页脚
    elements.append(Spacer(1, 40))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=1)
    elements.append(Paragraph(f"生成日期: {date.today().strftime('%Y-%m-%d')}", footer_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
