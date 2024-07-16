import React, { Component } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from './firebaseConfig';
import './App.css';
import { hexToRgb, hexToHsl } from './colorUtils';
import CanvasJSReact from '@canvasjs/react-charts';
import { Card, Button, Container, Row, Col, DropdownButton, Dropdown } from 'react-bootstrap';
import { formatInTimeZone } from 'date-fns-tz';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;
const database = getDatabase(app);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      color: "#000000",
      colors: [],
      dataPoints: [],
      displayPoints: 10
    };
    this.chartRef = React.createRef();
  }

  componentDidMount() {
    const colorRef = ref(database, '/sensor/color');
    onValue(colorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sortedEntries = Object.entries(data).sort((a, b) => b[0] - a[0]);
        const currentTime = new Date();
        const allColors = sortedEntries.slice(0, 100).map((entry, index) => {
          const hex = entry[1].hex ? Object.values(entry[1].hex)[0] : "#000000";
          const timestamp = new Date(currentTime.getTime() - (index * 5000));
          return { id: timestamp.getTime(), hex, timestamp };
        });
  
        const dataPoints = allColors.map(color => ({
          x: color.timestamp,
          y: parseInt(color.hex.slice(1), 16),
          label: this.formatBkkTime(color.timestamp)
        }));
  
        this.setState({
          color: allColors[0].hex,
          colors: allColors,
          dataPoints: dataPoints
        }, () => {
          if (this.chart) {
            this.chart.render();
          }
        });
      }
    });
  }

  formatBkkTime = (date) => {
    return formatInTimeZone(date, 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
  }

  handleDataPointsChange = (points) => {
    this.setState({ displayPoints: points });
  }

  exportToCsv = () => {
    const { colors } = this.state;
    if (colors.length === 0) {
      console.log('No data available to export');
      return;
    }
  
    const metadata = [
      'Color Sensor Data Export',
      `Generated on: ${this.formatBkkTime(new Date())}`,
      'Data shows color readings over time',
      '',
    ];
  
    const headers = ['Time', 'Hex', 'Decimal', 'R', 'G', 'B', 'H', 'S', 'L'];
    const rows = colors.map(color => {
      const rgb = hexToRgb(color.hex);
      const hsl = hexToHsl(color.hex);
      return [
        this.formatBkkTime(color.timestamp),
        color.hex,
        parseInt(color.hex.slice(1), 16),
        rgb.r,
        rgb.g,
        rgb.b,
        Math.round(hsl.h),
        Math.round(hsl.s),
        Math.round(hsl.l)
      ];
    });

    let csvContent = metadata.join('\n') + '\n';
    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'color_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  render() {
    const { color, dataPoints, displayPoints } = this.state;
    const rgb = hexToRgb(color);
    const hsl = hexToHsl(color);

    const options = {
      theme: "light2",
      animationEnabled: false,
      title: {
        text: "Color Changes Over Time",
        fontFamily: "Mitr, sans-serif",
        fontSize: 24,
        fontColor: "#003366"
      },
      axisX: {
        title: "Time (BKK)",
        titleFontFamily: "Mitr, sans-serif",
        titleFontColor: "#003366",
        valueFormatString: "HH:mm:ss",
        labelFormatter: function(e) {
          return formatInTimeZone(e.value, 'Asia/Bangkok', 'HH:mm:ss');
        },
        labelFontFamily: "Mitr, sans-serif",
        lineColor: "#003366"
      },
      axisY: {
        title: "Color (Decimal)",
        titleFontFamily: "Mitr, sans-serif",
        titleFontColor: "#003366",
        valueFormatString: "#",
        labelFontFamily: "Mitr, sans-serif",
        lineColor: "#003366"
      },
      data: [{
        type: "line",
        xValueFormatString: "yyyy-MM-dd HH:mm:ss",
        yValueFormatString: "#",
        dataPoints: dataPoints.slice(0, displayPoints).reverse(),
        lineColor: "#0066cc",
        markerColor: "#003366"
      }]
    };

    return (
      <Container fluid className="dashboard">
        <Row>
          <Col md={8}>
            <Card className="chart-card">
              <Card.Body>
                <Card.Title className="dashboard-title">Color Change Graph</Card.Title>
                <CanvasJSChart options={options} onRef={ref => this.chart = ref} />
                <div className="dashboard-controls">
                  <DropdownButton id="dropdown-basic-button" title={`Show latest ${displayPoints} data points`} variant="outline-primary">
                    <Dropdown.Item onClick={() => this.handleDataPointsChange(10)}>Show latest 10 data points</Dropdown.Item>
                    <Dropdown.Item onClick={() => this.handleDataPointsChange(20)}>Show latest 20 data points</Dropdown.Item>
                    <Dropdown.Item onClick={() => this.handleDataPointsChange(30)}>Show latest 30 data points</Dropdown.Item>
                  </DropdownButton>
                  <Button variant="primary" onClick={this.exportToCsv}>Export to CSV</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="color-card">
              <Card.Body>
                <Card.Title className="dashboard-title">Current Color</Card.Title>
                <div className="color-box" style={{ backgroundColor: color }}>
                  {color}
                </div>
                <div className="color-details">
                  <p><strong>Hex:</strong> {color}</p>
                  <p><strong>RGB:</strong> {rgb.r}, {rgb.g}, {rgb.b}</p>
                  <p><strong>HSL:</strong> {hsl.h}°, {hsl.s}%, {hsl.l}%</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;