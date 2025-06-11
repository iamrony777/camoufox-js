import {
    type Browser,
    type BrowserContext,
    type BrowserType,
    firefox
} from 'playwright-core';

import { type LaunchOptions, launchOptions, syncAttachVD } from './utils.js';
import { VirtualDisplay } from './virtdisplay.js';

export async function Camoufox(launch_options: LaunchOptions | { headless?: boolean | 'virtual' }) {
    const { headless = false, ...restLaunchOptions } = launch_options;
    return NewBrowser(firefox, headless, {}, false, false, restLaunchOptions);
}

export async function NewBrowser(
    playwright: BrowserType<Browser>,
    headless?: boolean | 'virtual',
    fromOptions?: Record<string, unknown>,
    persistentContext?: true,
    debug?: boolean,
    launch_options?: LaunchOptions
): Promise<BrowserContext>;

export async function NewBrowser(
    playwright: BrowserType<Browser>,
    headless?: boolean | 'virtual',
    fromOptions?: Record<string, unknown>,
    persistentContext?: false,
    debug?: boolean,
    launch_options?: LaunchOptions
): Promise<Browser>;

export async function NewBrowser(
    playwright: BrowserType<Browser>,
    headless: boolean | 'virtual' = false,
    fromOptions: Record<string, unknown> = {},
    persistentContext = false,
    debug = false,
    launch_options: LaunchOptions = {}
): Promise<Browser | BrowserContext> {
    let virtualDisplay: VirtualDisplay | null = null;

    if (headless === 'virtual') {
        virtualDisplay = new VirtualDisplay(debug);
        launch_options.virtual_display = virtualDisplay.get();
        launch_options.headless = false;
    } else {
        launch_options.headless ||= headless;
    }

    let options = fromOptions;
    if (!options || Object.keys(options).length === 0) {
        options = await launchOptions({ debug, ...launch_options });
    }

    if (persistentContext) {
        if (!launch_options.user_data_dir && !options.user_data_dir && !options.userDataDir) {
            console.warn('user_data_dir is not set, using default user data dir');
            options.user_data_dir = '~/.crawlee/persistent-user-data-dir';
        } else {
            options.user_data_dir = launch_options.user_data_dir || options.user_data_dir || options.userDataDir;
        }

        const context = await playwright.launchPersistentContext(options.user_data_dir as string, options);
        return syncAttachVD(context, virtualDisplay);
    }

    const browser = await playwright.launch(options);
    return syncAttachVD(browser, virtualDisplay);
}
