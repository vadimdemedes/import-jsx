'use strict';

const React = {createElement: () => {}}

const Child = () => {};

const Parent = ({children, ...props}) => (
	<Child {...props}>
		{children}
	</Child>
);
