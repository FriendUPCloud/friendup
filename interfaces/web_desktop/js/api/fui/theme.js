/* Base theme --------------------------------------------------------------- */

FUI.theme = {
	// Name your theme
	name: 'FUI Dark',
	
	// Underneath are some definitions that are obligatory! You can change the
	// values, but not the attributes
	
	// Palette definitions
	palette: {
		background:    { color: '#3C3A3C', name: 'Background' },
		foreground:    { color: '#2E2F31', name: 'Foreground' },
		highlightText: { color: '#ffffff', name: 'Highlight text' },
		shine:         { color: '#ffffff', name: 'Shine' },
		shadow:        { color: '#000000', name: 'Shadow' },
		halfshine:     { color: '#f0f0f0', name: 'Halfshine' },
		halfshadow:    { color: '#707070', name: 'Halfshadow' },
		bordershine:   { color: '#979797', name: 'Border shine' },
		bordershadow:  { color: '#979797', name: 'Border shadow' },
		fill:          { color: '#636163', name: 'Fill' },
		fillText:      { color: '#ffffff', name: 'Fill text' },
		fillShine:     { color: '#ffffff', name: 'Fill shine' },
		fillShadow:    { color: '#000000', name: 'Fill shadow' },
		borderColor:   { color: '#979797', name: 'Border color' }
	},
	// Gadget proportions
	gadgets: {
		margins: {
			normal: '10px'
		},
		rect: {
			borderWidth: {
				top:    '1px',
				left:   '1px',
				right:  '1px',
				bottom: '1px'
			},
			borderStyle: 'solid',
			borderRadius: {
				top:    '0px',
				left:   '0px',
				right:  '0px',
				bottom: '0px'
			}
		},
		button: {
			
		}
	},
	// Named fontstyles
	fontStyles: {
		normal: {
			
		},
		large: {
			fontSize: '16px',
			weight: 'bold'
		},
		small: {
		},
		extraSmall: {
		},
		emphasized: {
		}
	},
	// Icon support definitions (classnames for web css)
	icons: {
		'Bookmark':  'IconSmall fa-bookmark',
		'Plus':      'IconSmall fa-plus',
		'Video':     'IconSmall fa-video-camera',
		'Calendar':  'IconSmall fa-calendar',
		'Clipboard': 'IconSmall fa-clipboard',
		'Copy':      'IconSmall fa-copy',
		'Send':      'IconSmall fa-send'
	},
	// Optional web css path - relative url!
	webCSS: '/themes/fui/dark.css'
};



