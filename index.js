import React from "react";
import { View, Text, FlatList, StyleSheet, Dimensions, Animated, TouchableOpacity, Image, ScrollView } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import HTML from 'react-native-render-html';
import WebViewModal from 'webview-modal';
import moment from 'moment';
import { width, months, weekDays, expandedCalendarHeight, collapsedCalendarHeight, generateMatrix } from './utils';

class SimpleAgenda extends React.Component {
  constructor(props) {
    super(props);
    this.heightValue = new Animated.Value(expandedCalendarHeight);
    this.mirrorValue = new Animated.Value(0);
    this.events = {};
    this.eventsPositions = {};
    this.today = new Date();
    this.state = {
      activeDate: this.today,
      visibleMonth: this.today.getMonth(),
      visibleYear: this.today.getFullYear(),
      collapsed: false,
      modalVisible: false,
      modalURL: null
    };
  };

  componentDidMount = () => {
    let date, strTime;
    let media_url = "";
    let events = this.props.calendar;

    for (let event of events) {
      media_url = "";
      if (event.properties && event.properties[0]["value"]) {
        media_url = event.properties[0]["value"]
      }
      for (let runDate of event.run_dates) {
        date = new Date(runDate);
        strTime = moment(date).format('YYYY-MM-DD');
        if (!this.events[strTime]) {
          this.events[strTime] = [];
        }
        this.events[strTime].push({
          name: event.name,
          media_url: media_url,
          time: this.getTime(date),
          description: event.description,
          date: date
        })
      }
    }

    date = moment().format("YYYY-MM-DD")
    if (!this.events[date]) {
      this.events[date] = [];
    }
  };

  toggleCalendar = () => {
    Animated.parallel([
      Animated.timing(this.mirrorValue, {
        toValue: this.state.collapsed ? 1 : -1,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(this.heightValue, {
        toValue: this.state.collapsed ? expandedCalendarHeight : collapsedCalendarHeight,
        duration: 250,
      })
    ]).start(() => {
      this.setState({ collapsed: !this.state.collapsed })
    })
  };

  setActiveDate = (day, month, year) => {
    if (day != -1) {
      const date = new Date(year, month, day);
      const dateString = 'events-' + moment(date).format('YYYY-MM-DD');
      this.setState({ activeDate: new Date(year, month, day) }, () => {
        if (this.eventsPositions[dateString] != null) {
          this.eventsFlatList.scrollTo({ y: this.eventsPositions[dateString] })
        }
      })
    }
  };

  equalsActiveDate = (day, month, year) => {
    return (new Date(year, month, day)).toDateString() == this.state.activeDate.toDateString();
  };

  formatDay = (day, month, year) => {
    if (this.equalsActiveDate(day, month, year)) {
      return {
        backgroundColor: this.props.color,
        color: '#FFFFFF'
      }
    } else {
      if (day != -1) {
        month += 1;
        if (month < 10) month = '0' + month;
        if (day < 10) day = '0' + day;
        if (this.events[`${year}-${month}-${day}`] != null) {
          return {
            backgroundColor: '#EAEAEA',
            color: '#000000',
          }
        } else {
          return {
            backgroundColor: '#FFFFFF',
            color: '#000000',
          }
        }
      } else {
        return {
          backgroundColor: '#FFFFFF',
          color: '#000000'
        }
      }
    }
  };

  renderMonth = (month, year) => {
    var matrix = generateMatrix(month, year);
    var rows = [];
    rows = matrix.map((row, rowIndex) => {
      var rowItems = row.map((item, colIndex) => {
        if (rowIndex == 0) {
          return (
            <Text style={[styles.week, { backgroundColor: this.props.color }]} key={`day-${colIndex}-${month}-${year}`}>
              {item}
            </Text>
          );
        } else {
          return (
            <Text style={[styles.day, this.formatDay(item, month, year)]} onPress={() => this.setActiveDate(item, month, year)} key={`day-${colIndex}-${month}-${year}`}>
              {item != -1 ? item : ''}
            </Text>
          );
        }
      });
      return (
        <View
          style={styles.weekContainer}
          key={`week-${rowIndex}-${month}-${year}`}
        >
          {rowItems}
        </View>
      );
    });
    return (
      <View style={styles.monthContainer} key={`month-${month}-${year}`} year={year} month={month}>
        <Text style={styles.monthName(this.props.color)}>{months[month]}</Text>
        {rows}
      </View>
    );
  };

  getTime = (date) => {
    let hour = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let timeType = hour < 12 ? 'AM' : 'PM'

    if (hour > 12)
      hour -= 12;

    if (hour == 0)
      hour = 12;

    if (minutes < 10)
      minutes = '0' + minutes.toString();

    if (seconds < 10)
      seconds = '0' + seconds.toString();

    return `${hour}:${minutes} ${timeType}`
  };

  renderMonths = () => {
    let items = []
    let pastYear = (new Date()).getFullYear() - 1;
    const nextYear = (new Date()).getFullYear() + 1;
    for (let year = pastYear; year <= nextYear; year++) {
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((month) => {
        items.push(this.renderMonth(month, year))
      })
    }
    return items;
  };

  getItemLayout = (data, index) => {
    return { length: width - 20, offset: (width - 20) * index, index }
  };

  handleMonthChange = ({ viewableItems }) => {
    if (viewableItems.length == 0) return;
    const node = viewableItems[0];
    const { year, month } = node.item.props;
    this.setState({ visibleMonth: month, visibleYear: year }, () => {
      this.eventsFlatList.scrollTo({ y: 0 });
    });
  };

  getEventsForVisibleMonth = () => {
    let month, year;
    let filteredEvents = [];
    Object.keys(this.events).sort().forEach((date, index) => {
      [year, month] = date.split('-');
      if (year == this.state.visibleYear && month == this.state.visibleMonth + 1) {
        filteredEvents.push({
          date: date,
          events: this.events[date]
        });
      }
    })
    return filteredEvents;
  };

  shouldComponentUpdate = (nextProps, nextState) => {
    return !this.eventsRendered || nextState.activeDate != this.state.activeDate || nextState.visibleYear != this.state.visibleYear || nextState.visibleMonth != this.state.visibleMonth;
  };

  renderImage = (media_url) => {
    return (
      <View>
        {media_url ? (<Image source={{ uri: media_url }} style={styles.image} />) : null}
      </View>
    )
  };

  storeDayEventsPosition = (key, event) => {
    this.eventsPositions[key] = event.nativeEvent.layout.y;
  };

  renderDayEvents = (element) => {
    const events = element.events;
    const dateString = element.date;
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    const key = `events-${dateString}`;
    return (
      <View style={[styles.item, { borderColor: this.props.color }]} key={key} onLayout={(event) => this.storeDayEventsPosition(key, event)}>
        <View style={styles.flexContainer}>
          <Text style={styles.eventDate}>{`${weekDays[date.getDay()]} ${date.getDate()}`}</Text>
        </View>
        <View>
          {events.map((event, index) => (
            <View key={`event-${dateString}-${index}`}>
              {index > 0 && index < events.length ? <View style={styles.separator}></View> : null}
              <View style={styles.flexContainer}>
                <Text style={styles.timeText}>{event.time}</Text>
              </View>
              <View style={styles.subItem}>
                <Text style={styles.titleText}>{event.name}</Text>
                {this.renderImage(event.media_url)}
                <HTML html={event.description} textSelectable={true} onLinkPress={(event, href) => { this.openWebViewModal(href) }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  openWebViewModal = (url) => {
    this.setState({ modalVisible: true, modalURL: url });
  };

  renderEvents = () => {
    const days = this.getEventsForVisibleMonth();
    return (
      <ScrollView ref={(ref) => this.eventsFlatList = ref}>
        {days.map((events, index) => {
          return this.renderDayEvents(events);
        })}
      </ScrollView>
    )
  };

  renderItem = (item) => (item.item);

  renderCalendar = () => {
    return (
      <Animated.View style={styles.animatedContainer(this.heightValue, this.props.color)}>
        <Text style={styles.yearText(this.props.color)}>{this.state.visibleYear}</Text>
        <FlatList
          data={this.renderMonths()}
          renderItem={this.renderItem}
          contentContainerStyle={styles.contentContainerStyle}
          initialScrollIndex={13}
          getItemLayout={this.getItemLayout}
          onViewableItemsChanged={this.handleMonthChange}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          snapToInterval={width - 20}
          decelerationRate="fast"
          disableScrollViewPanResponder={true}
          disableIntervalMomentum={true}
          removeClippedSubviews={true}
          initialNumToRender={1}
          windowSize={3}
          maxToRenderPerBatch={1}
        />
        <TouchableOpacity style={[styles.collapseButton, { transform: [{ scaleY: this.mirrorValue }] }]} onPress={this.toggleCalendar}>
          <Icon name={"keyboard-arrow-up"} color={this.props.color} size={32} style={styles.collapseIcon} />
        </TouchableOpacity>
      </Animated.View>
    )
  };

  toggleModal = () => this.setState({ modalVisible: !this.state.modalVisible });

  render = () => (
    <View style={styles.mainContainer}>
      {this.renderCalendar()}
      {this.renderEvents()}
      <WebViewModal source={this.state.modalURL} onRequestClose={this.toggleModal} visible={this.state.modalVisible} />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1
  },
  scrollview: {
    flex: 1
  },
  container: {
    flex: 1,
    alignItems: 'center'
  },
  flexContainer: {
    flex: 1
  },
  day: {
    height: '90%',
    width: (width - 20) / 7 - 8,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 4,
    marginLeft: 4,
    marginRight: 4
  },
  week: {
    height: '90%',
    width: (width - 20) / 7,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  item: {
    backgroundColor: 'white',
    flex: 1,
    borderRadius: 4,
    margin: 10,
    padding: 10,
    borderWidth: 1
  },
  subItem: {
    alignItems: 'center'
  },
  titleText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 5
  },
  timeText: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'left',
    fontWeight: 'bold'
  },
  eventDate: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  collapseButton: {
    alignSelf: 'center',
    width: '100%',
    height: 32
  },
  collapseIcon: {
    alignSelf: 'center'
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: 'stretch'
  },
  contentContainerStyle: {
    height: expandedCalendarHeight - collapsedCalendarHeight
  },
  weekContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center'
  },
  monthContainer: {
    width: width - 20,
    height: expandedCalendarHeight - collapsedCalendarHeight
  },
  monthName: (color) => ({
    color: color,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    paddingBottom: 4
  }),
  separator: {
    width: '100%',
    borderBottomWidth: 1,
    paddingVertical: 10
  },
  animatedContainer: (height, borderColor) => ({
    margin: 10,
    borderRadius: 4,
    borderWidth: 1,
    height: height,
    borderColor: borderColor
  }),
  yearText: (color) => ({
    color: color,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center'
  })
});

export default SimpleAgenda;
