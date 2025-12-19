// [순수 JS 버전] notifications.js

/**
 * Gmail API wrapper
 */
const GmailAPI = {
  // : string, : Promise<number> 제거됨
  async getUnreadCount(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=1', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      return data.resultSizeEstimate || 0;
    } catch (error) {
      console.error('Gmail API error:', error);
      return 0;
    }
  },

  async getRecentMails(accessToken, maxResults = 5) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=${maxResults}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();
      return data.messages?.map((msg) => ({
        id: msg.id,
        source: 'gmail',
        title: 'Gmail',
        description: msg.snippet || 'New mail',
        unread: true,
        timestamp: msg.internalDate,
        link: 'https://mail.google.com',
      })) || [];
    } catch (error) {
      console.error('Gmail API error:', error);
      return [];
    }
  },
};

/**
 * GitHub API wrapper
 */
const GitHubAPI = {
  async getNotifications(accessToken) {
    try {
      const response = await fetch('https://api.github.com/notifications', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      const data = await response.json();
      return data.map((notif) => ({
        id: notif.id,
        source: 'github',
        title: notif.repository.name,
        description: notif.subject.title,
        unread: notif.unread,
        timestamp: new Date(notif.updated_at).getTime(),
        link: notif.subject.url,
        icon: notif.repository.owner.avatar_url,
      }));
    } catch (error) {
      console.error('GitHub API error:', error);
      return [];
    }
  },

  async getIssuesPR(accessToken) {
    try {
      const response = await fetch('https://api.github.com/user/issues?state=open&per_page=10', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      const data = await response.json();
      return data.map((item) => ({
        id: item.id,
        source: 'github',
        title: item.repository.name,
        description: `${item.state.toUpperCase()}: ${item.title}`,
        unread: false,
        timestamp: new Date(item.updated_at).getTime(),
        link: item.html_url,
      }));
    } catch (error) {
      console.error('GitHub API error:', error);
      return [];
    }
  },
};

/**
 * External API integrations for widgets
 */
const WidgetAPIs = {
  async getIpLocation() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city
      };
    } catch (error) {
      console.error('IP Location API error:', error);
      return {
        latitude: 33.4996,
        longitude: 126.5312,
        city: "제주시청"
      };
    }
  },

  // lat = null 처럼 기본값 문법은 JS에서도 유효함
  async getWeather(lat = null, lon = null) {
    try {
      let latitude = lat;
      let longitude = lon;
      if (latitude === null || longitude === null) {
        // this를 사용하여 내부 함수 호출
        const location = await this.getIpLocation();
        latitude = location.latitude;
        longitude = location.longitude;
      }
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
      );

      const data = await response.json();

      return {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        weatherCode: data.current.weather_code,
        locationInfo: { lat : latitude, lon : longitude }
      };
    } catch (error) {
      console.error('Weather API error:', error);
      return null;
    }
  },

  async getRandomImage() {
    try {
      const response = await fetch('https://api.unsplash.com/photos/random?client_id=YOUR_UNSPLASH_KEY');
      return await response.json();
    } catch (error) {
      console.error('Unsplash API error:', error);
      return null;
    }
  },

  async getRandomGif() {
    try {
      const response = await fetch('https://api.giphy.com/v1/gifs/random?api_key=YOUR_GIPHY_KEY');
      return await response.json();
    } catch (error) {
      console.error('GIPHY API error:', error);
      return null;
    }
  },

  async getRandomCat() {
    try {
      const response = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await response.json();
      return data[0];
    } catch (error) {
      console.error('Cat API error:', error);
      return null;
    }
  },

  async getRandomDog() {
    try {
      const response = await fetch('https://dog.ceo/api/breeds/image/random');
      return await response.json();
    } catch (error) {
      console.error('Dog API error:', error);
      return null;
    }
  },
};