import { Notification } from '../types';

/**
 * Gmail API wrapper
 */
export const GmailAPI = {
  async getUnreadCount(accessToken: string): Promise<number> {
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

  async getRecentMails(accessToken: string, maxResults = 5): Promise<Notification[]> {
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
      // Parse and map to Notification format
      return data.messages?.map((msg: any) => ({
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
export const GitHubAPI = {
  async getNotifications(accessToken: string): Promise<Notification[]> {
    try {
      const response = await fetch('https://api.github.com/notifications', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      const data = await response.json();
      return data.map((notif: any) => ({
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

  async getIssuesPR(accessToken: string): Promise<Notification[]> {
    try {
      const response = await fetch('https://api.github.com/user/issues?state=open&per_page=10', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      const data = await response.json();
      return data.map((item: any) => ({
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
export const WidgetAPIs = {
  /**
   * Get weather data (using Open-Meteo free API)
   */
  async getWeather(latitude: number, longitude: number) {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
      );
      return await response.json();
    } catch (error) {
      console.error('Weather API error:', error);
      return null;
    }
  },

  /**
   * Get random image from Unsplash
   */
  async getRandomImage() {
    try {
      const response = await fetch('https://api.unsplash.com/photos/random?client_id=YOUR_UNSPLASH_KEY');
      return await response.json();
    } catch (error) {
      console.error('Unsplash API error:', error);
      return null;
    }
  },

  /**
   * Get random GIF from GIPHY
   */
  async getRandomGif() {
    try {
      const response = await fetch('https://api.giphy.com/v1/gifs/random?api_key=YOUR_GIPHY_KEY');
      return await response.json();
    } catch (error) {
      console.error('GIPHY API error:', error);
      return null;
    }
  },

  /**
   * Get random cat image
   */
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

  /**
   * Get random dog image
   */
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
